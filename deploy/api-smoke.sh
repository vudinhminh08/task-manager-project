#!/usr/bin/env bash
#
# API smoke test against a running backend.
#
# Usage:
#   deploy/api-smoke.sh                        # defaults to http://localhost:8080
#   deploy/api-smoke.sh https://<railway-host>
#
# Covers the register/login/create/list/detail/update/delete sequence plus
# ownership isolation, filters, and the documented error contract. Run it
# against PostgreSQL, not H2: the automated suite runs on H2 and cannot prove
# PostgreSQL behavior. Exits non-zero when any check fails.
#
# Creates throwaway accounts with random emails. Do not point it at a database
# holding data you want to keep pristine.

set -uo pipefail

API="${1:-http://localhost:8080}/api"
pass=0
fail=0

check() { # check <label> <expected> <actual>
  if [ "$2" = "$3" ]; then
    printf '  PASS  %-52s %s\n' "$1" "$3"
    pass=$((pass + 1))
  else
    printf '  FAIL  %-52s expected %s got %s\n' "$1" "$2" "$3"
    fail=$((fail + 1))
  fi
}

code() { tail -1 <<<"$1"; }
body() { sed '$d' <<<"$1"; }
field() { sed -n "s/.*\"$2\":\"\([^\"]*\)\".*/\1/p" <<<"$1"; }
rows() { grep -o '"id":' <<<"$1" | wc -l | tr -d ' '; }

req() { # req <method> <path> <token> [json-body]
  local method=$1 path=$2 token=$3 data=${4:-}
  if [ -n "$data" ]; then
    curl -s -w '\n%{http_code}' -X "$method" "$API$path" \
      -H 'Content-Type: application/json' \
      ${token:+-H "Authorization: Bearer $token"} -d "$data"
  else
    curl -s -w '\n%{http_code}' -X "$method" "$API$path" \
      ${token:+-H "Authorization: Bearer $token"}
  fi
}

status_and_rows() { # status_and_rows <path> <token>
  local r
  r=$(req GET "$1" "$2")
  echo "$(code "$r"):$(rows "$(body "$r")")"
}

echo "Smoke target: $API"

echo '== health =='
check 'health' 200 "$(code "$(req GET /health '')")"

echo '== auth =='
A_EMAIL="smoke.a.$RANDOM.$$@example.com"
B_EMAIL="smoke.b.$RANDOM.$$@example.com"
PASSWORD='smoke-password'

r=$(req POST /auth/register '' "{\"email\":\"$A_EMAIL\",\"password\":\"$PASSWORD\"}")
check 'register A' 201 "$(code "$r")"
TOKEN_A=$(field "$(body "$r")" accessToken)

r=$(req POST /auth/register '' "{\"email\":\"$B_EMAIL\",\"password\":\"$PASSWORD\"}")
check 'register B' 201 "$(code "$r")"
TOKEN_B=$(field "$(body "$r")" accessToken)

upper_a=$(printf '%s' "$A_EMAIL" | tr '[:lower:]' '[:upper:]')
r=$(req POST /auth/register '' "{\"email\":\"  $upper_a  \",\"password\":\"$PASSWORD\"}")
check 'duplicate email after normalization' 409 "$(code "$r")"
check '  code' EMAIL_ALREADY_EXISTS "$(field "$(body "$r")" code)"

r=$(req POST /auth/login '' "{\"email\":\"$A_EMAIL\",\"password\":\"$PASSWORD\"}")
check 'login' 200 "$(code "$r")"

r=$(req POST /auth/login '' "{\"email\":\"$A_EMAIL\",\"password\":\"wrong-password\"}")
check 'login with wrong password' 401 "$(code "$r")"
check '  code' INVALID_CREDENTIALS "$(field "$(body "$r")" code)"

r=$(req POST /auth/register '' '{"email":"not-an-email","password":"short"}')
check 'invalid register payload' 400 "$(code "$r")"
check '  code' VALIDATION_ERROR "$(field "$(body "$r")" code)"

echo '== protected access =='
r=$(req GET /transactions '')
check 'missing token' 401 "$(code "$r")"
check '  code' UNAUTHORIZED "$(field "$(body "$r")" code)"
check 'malformed token' 401 "$(code "$(req GET /transactions 'garbage.token.value')")"

echo '== transaction CRUD =='
r=$(req POST /transactions "$TOKEN_A" \
  '{"type":"EXPENSE","amount":125000.00,"category":"Ăn uống","description":"Bữa trưa","transactionDate":"2026-07-30"}')
check 'create expense' 201 "$(code "$r")"
ID_A=$(sed -n 's/.*"id":\([0-9]*\).*/\1/p' <<<"$(body "$r")")
check '  response omits userId' '' "$(grep -o '"userId"' <<<"$(body "$r")")"

check 'create income in an earlier month' 201 "$(code "$(req POST /transactions "$TOKEN_A" \
  '{"type":"INCOME","amount":15000000.00,"category":"Lương","description":null,"transactionDate":"2026-06-01"}')")"

r=$(req GET /transactions "$TOKEN_A")
check 'list' 200 "$(code "$r")"
check '  returns both rows' 2 "$(rows "$(body "$r")")"
check '  newest transaction first' '"transactionDate":"2026-07-30"' \
  "$(grep -o '"transactionDate":"[^"]*"' <<<"$(body "$r")" | head -1)"

check 'detail' 200 "$(code "$(req GET "/transactions/$ID_A" "$TOKEN_A")")"

r=$(req PUT "/transactions/$ID_A" "$TOKEN_A" \
  '{"type":"EXPENSE","amount":99000.00,"category":"Đi lại","description":"Xe buýt","transactionDate":"2026-07-31"}')
check 'update' 200 "$(code "$r")"
check '  amount replaced' 99000.00 "$(sed -n 's/.*"amount":\([0-9.]*\).*/\1/p' <<<"$(body "$r")")"

echo '== filters =='
check 'type'                  '200:1' "$(status_and_rows '/transactions?type=INCOME' "$TOKEN_A")"
check 'month with rows'       '200:1' "$(status_and_rows '/transactions?month=2026-06' "$TOKEN_A")"
check 'category lowercased'   '200:1' "$(status_and_rows '/transactions?category=l%C6%B0%C6%A1ng' "$TOKEN_A")"
check 'category and type'     '200:1' "$(status_and_rows '/transactions?category=L%C6%B0%C6%A1ng&type=INCOME' "$TOKEN_A")"
check 'filters combine as AND' '200:0' "$(status_and_rows '/transactions?type=INCOME&month=2026-07' "$TOKEN_A")"
check 'all three filters'     '200:1' "$(status_and_rows '/transactions?type=INCOME&category=L%C6%B0%C6%A1ng&month=2026-06' "$TOKEN_A")"

echo '== ownership isolation =='
r=$(req GET "/transactions/$ID_A" "$TOKEN_B")
check "B reads A's transaction" 404 "$(code "$r")"
check '  code' TRANSACTION_NOT_FOUND "$(field "$(body "$r")" code)"
check "B updates A's transaction" 404 "$(code "$(req PUT "/transactions/$ID_A" "$TOKEN_B" \
  '{"type":"EXPENSE","amount":1.00,"category":"x","description":null,"transactionDate":"2026-07-01"}')")"
check "B deletes A's transaction" 404 "$(code "$(req DELETE "/transactions/$ID_A" "$TOKEN_B")")"
check "B's list is empty" '200:0' "$(status_and_rows /transactions "$TOKEN_B")"

echo '== error contract =='
r=$(req POST /transactions "$TOKEN_A" \
  '{"type":"EXPENSE","amount":-5,"category":"","description":null,"transactionDate":"2026-07-30"}')
check 'negative amount and blank category' 400 "$(code "$r")"
check '  code' VALIDATION_ERROR "$(field "$(body "$r")" code)"
check '  reports the offending fields' yes \
  "$(grep -q '"fieldErrors":{"' <<<"$(body "$r")" && echo yes || echo no)"

check 'future transaction date' 400 "$(code "$(req POST /transactions "$TOKEN_A" \
  '{"type":"EXPENSE","amount":10,"category":"x","description":null,"transactionDate":"2099-01-01"}')")"

r=$(req GET '/transactions?type=OTHER' "$TOKEN_A")
check 'unknown type value' 400 "$(code "$r")"
check '  code' MALFORMED_REQUEST "$(field "$(body "$r")" code)"

r=$(req GET '/transactions?month=2026-7' "$TOKEN_A")
check 'malformed month value' 400 "$(code "$r")"
check '  code' MALFORMED_REQUEST "$(field "$(body "$r")" code)"

r=$(curl -s -w '\n%{http_code}' -X POST "$API/transactions" \
  -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN_A" -d '{"type":')
check 'malformed JSON body' 400 "$(code "$r")"
check '  code' MALFORMED_REQUEST "$(field "$(body "$r")" code)"

echo '== delete =='
check 'delete' 204 "$(code "$(req DELETE "/transactions/$ID_A" "$TOKEN_A")")"
check 'detail after delete' 404 "$(code "$(req GET "/transactions/$ID_A" "$TOKEN_A")")"

echo '== CORS =='
ORIGIN="${CORS_ORIGIN:-http://localhost:4200}"
preflight=$(curl -s -i -X OPTIONS "$API/transactions" \
  -H "Origin: $ORIGIN" -H 'Access-Control-Request-Method: GET')
check "preflight allows $ORIGIN" yes \
  "$(grep -qi "access-control-allow-origin: $ORIGIN" <<<"$preflight" && echo yes || echo no)"
check 'preflight rejects an unknown origin' 403 \
  "$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS "$API/transactions" \
    -H 'Origin: http://unknown.example.com' -H 'Access-Control-Request-Method: GET')"

echo
echo "RESULT: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
