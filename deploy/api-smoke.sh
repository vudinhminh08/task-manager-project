#!/usr/bin/env bash
#
# Local Task Manager API smoke test.
#
# Usage:
#   deploy/api-smoke.sh                         # http://localhost:8080
#   deploy/api-smoke.sh http://localhost:8080
#
# The target must be a running API backed by local PostgreSQL. The script
# creates throwaway accounts and tasks and never needs credentials or hosted
# service configuration.

set -uo pipefail

API="${1:-http://localhost:8080}/api"
pass=0
fail=0

check() { # check <label> <expected> <actual>
  if [ "$2" = "$3" ]; then
    printf '  PASS  %-56s %s\n' "$1" "$3"
    pass=$((pass + 1))
  else
    printf '  FAIL  %-56s expected %s got %s\n' "$1" "$2" "$3"
    fail=$((fail + 1))
  fi
}

code() { tail -n 1 <<<"$1"; }
body() { sed '$d' <<<"$1"; }
json_string() {
  sed -nE "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"([^\"]*)\".*/\1/p" <<<"$2" | head -n 1
}
json_number() {
  sed -nE "s/.*\"$1\"[[:space:]]*:[[:space:]]*([0-9]+).*/\1/p" <<<"$2" | head -n 1
}
json_null() {
  if grep -qE "\"$1\"[[:space:]]*:[[:space:]]*null" <<<"$2"; then
    printf 'yes'
  else
    printf 'no'
  fi
}
json_has_key() {
  if grep -qE "\"$1\"[[:space:]]*:" <<<"$2"; then
    printf 'yes'
  else
    printf 'no'
  fi
}
rows() {
  local count
  count=$(grep -o '"id"[[:space:]]*:' <<<"$1" || true)
  [ -n "$count" ] && wc -l <<<"$count" | tr -d ' ' || printf '0'
}

req() { # req <method> <path> <token> [json-body]
  local method="$1" path="$2" token="$3" data="${4-}"
  local -a args=(-sS -w $'\n%{http_code}' -X "$method" "$API$path")
  if [ -n "$token" ]; then
    args+=(-H "Authorization: Bearer $token")
  fi
  if [ -n "$data" ]; then
    args+=(-H 'Content-Type: application/json' -d "$data")
  fi
  curl "${args[@]}"
}

status_and_rows() { # status_and_rows <path> <token>
  local response="$1" token="$2"
  local result
  result=$(req GET "$response" "$token")
  local result_code result_body result_rows
  result_code=$(code "$result")
  result_body=$(body "$result")
  result_rows=$(rows "$result_body")
  printf '%s:%s' "$result_code" "$result_rows"
}

echo "Smoke target: $API"

echo '== health =='
health_response=$(req GET /health '')
check 'health' 200 "$(code "$health_response")"

echo '== auth =='
A_EMAIL="smoke.a.$RANDOM.$$@example.com"
B_EMAIL="smoke.b.$RANDOM.$$@example.com"
PASSWORD="smoke-password-$RANDOM-$$"

register_a=$(req POST /auth/register '' "{\"email\":\"$A_EMAIL\",\"password\":\"$PASSWORD\"}")
check 'register A' 201 "$(code "$register_a")"
register_a_body=$(body "$register_a")
TOKEN_A=$(json_string accessToken "$register_a_body")

register_b=$(req POST /auth/register '' "{\"email\":\"$B_EMAIL\",\"password\":\"$PASSWORD\"}")
check 'register B' 201 "$(code "$register_b")"
register_b_body=$(body "$register_b")
TOKEN_B=$(json_string accessToken "$register_b_body")

upper_a=$(printf '%s' "$A_EMAIL" | tr '[:lower:]' '[:upper:]')
duplicate=$(req POST /auth/register '' "{\"email\":\"  $upper_a  \",\"password\":\"$PASSWORD\"}")
check 'duplicate email after normalization' 409 "$(code "$duplicate")"
duplicate_body=$(body "$duplicate")
check '  duplicate error code' EMAIL_ALREADY_EXISTS "$(json_string code "$duplicate_body")"

login_a=$(req POST /auth/login '' "{\"email\":\"$A_EMAIL\",\"password\":\"$PASSWORD\"}")
check 'login' 200 "$(code "$login_a")"

wrong_password=$(req POST /auth/login '' "{\"email\":\"$A_EMAIL\",\"password\":\"wrong-password\"}")
check 'login with wrong password' 401 "$(code "$wrong_password")"
wrong_password_body=$(body "$wrong_password")
check '  invalid credentials code' INVALID_CREDENTIALS "$(json_string code "$wrong_password_body")"

invalid_register=$(req POST /auth/register '' '{"email":"not-an-email","password":"short"}')
check 'invalid register payload' 400 "$(code "$invalid_register")"
invalid_register_body=$(body "$invalid_register")
check '  validation code' VALIDATION_ERROR "$(json_string code "$invalid_register_body")"

echo '== protected access =='
missing_token=$(req GET /tasks '')
check 'missing token' 401 "$(code "$missing_token")"
missing_token_body=$(body "$missing_token")
check '  unauthorized code' UNAUTHORIZED "$(json_string code "$missing_token_body")"
malformed_token=$(req GET /tasks 'garbage.token.value')
check 'malformed token' 401 "$(code "$malformed_token")"

echo '== task CRUD =='
create_due_date=$(req POST /tasks "$TOKEN_A" \
  '{"title":"Write smoke plan","description":"Cover task CRUD","status":"TODO","priority":"HIGH","category":"Work","dueDate":"2000-01-01"}')
check 'create task with dueDate' 201 "$(code "$create_due_date")"
due_date_body=$(body "$create_due_date")
TASK_A=$(json_number id "$due_date_body")
check '  response omits userId' no "$(json_has_key userId "$due_date_body")"

create_no_due_date=$(req POST /tasks "$TOKEN_A" \
  '{"title":"Inbox task","description":null,"status":"IN_PROGRESS","priority":"LOW","category":"Home","dueDate":null}')
check 'create task with null dueDate' 201 "$(code "$create_no_due_date")"
no_due_date_body=$(body "$create_no_due_date")
check '  dueDate remains null' yes "$(json_null dueDate "$no_due_date_body")"

list_a=$(req GET /tasks "$TOKEN_A")
check 'list' 200 "$(code "$list_a")"
list_a_body=$(body "$list_a")
check '  returns both tasks' 2 "$(rows "$list_a_body")"
check '  list response omits userId' no "$(json_has_key userId "$list_a_body")"

detail_a=$(req GET "/tasks/$TASK_A" "$TOKEN_A")
check 'detail' 200 "$(code "$detail_a")"
detail_a_body=$(body "$detail_a")
check '  detail title' 'Write smoke plan' "$(json_string title "$detail_a_body")"

update_a=$(req PUT "/tasks/$TASK_A" "$TOKEN_A" \
  '{"title":"Ship smoke plan","description":"Updated task","status":"DONE","priority":"MEDIUM","category":"Work","dueDate":"2099-01-01"}')
check 'update' 200 "$(code "$update_a")"
update_a_body=$(body "$update_a")
check '  title replaced' 'Ship smoke plan' "$(json_string title "$update_a_body")"
check '  status replaced' DONE "$(json_string status "$update_a_body")"

echo '== filters =='
filter_status=$(status_and_rows '/tasks?status=IN_PROGRESS' "$TOKEN_A")
check 'status filter' '200:1' "$filter_status"
filter_priority=$(status_and_rows '/tasks?priority=MEDIUM' "$TOKEN_A")
check 'priority filter' '200:1' "$filter_priority"
filter_category=$(status_and_rows '/tasks?category=home' "$TOKEN_A")
check 'case-insensitive category filter' '200:1' "$filter_category"
filter_and=$(status_and_rows '/tasks?status=IN_PROGRESS&priority=LOW&category=HOME' "$TOKEN_A")
check 'status, priority, category combine as AND' '200:1' "$filter_and"
filter_empty=$(status_and_rows '/tasks?status=IN_PROGRESS&priority=HIGH' "$TOKEN_A")
check 'non-matching AND filters return no rows' '200:0' "$filter_empty"

echo '== ownership isolation =='
b_detail=$(req GET "/tasks/$TASK_A" "$TOKEN_B")
check "B reads A's task" 404 "$(code "$b_detail")"
b_detail_body=$(body "$b_detail")
check '  code' TASK_NOT_FOUND "$(json_string code "$b_detail_body")"
b_update=$(req PUT "/tasks/$TASK_A" "$TOKEN_B" \
  '{"title":"Should fail","description":null,"status":"TODO","priority":"LOW","category":"Other","dueDate":null}')
check "B updates A's task" 404 "$(code "$b_update")"
b_delete=$(req DELETE "/tasks/$TASK_A" "$TOKEN_B")
check "B deletes A's task" 404 "$(code "$b_delete")"
check "B's list is empty" '200:0' "$(status_and_rows /tasks "$TOKEN_B")"

echo '== error contract =='
blank_title=$(req POST /tasks "$TOKEN_A" \
  '{"title":"   ","description":null,"status":"TODO","priority":"LOW","category":"Other","dueDate":null}')
check 'blank title' 400 "$(code "$blank_title")"
blank_title_body=$(body "$blank_title")
check '  blank title code' VALIDATION_ERROR "$(json_string code "$blank_title_body")"

invalid_enum=$(req POST /tasks "$TOKEN_A" \
  '{"title":"Bad enum","description":null,"status":"BLOCKED","priority":"LOW","category":"Other","dueDate":null}')
check 'invalid status enum' 400 "$(code "$invalid_enum")"
invalid_enum_body=$(body "$invalid_enum")
check '  invalid enum code' MALFORMED_REQUEST "$(json_string code "$invalid_enum_body")"

invalid_priority=$(req POST /tasks "$TOKEN_A" \
  '{"title":"Bad priority","description":null,"status":"TODO","priority":"URGENT","category":"Other","dueDate":null}')
check 'invalid priority enum' 400 "$(code "$invalid_priority")"
invalid_priority_body=$(body "$invalid_priority")
check '  invalid priority code' MALFORMED_REQUEST "$(json_string code "$invalid_priority_body")"

malformed_json=$(req POST /tasks "$TOKEN_A" '{"title":')
check 'malformed JSON body' 400 "$(code "$malformed_json")"
malformed_json_body=$(body "$malformed_json")
check '  malformed JSON code' MALFORMED_REQUEST "$(json_string code "$malformed_json_body")"

missing_task=$(req GET /tasks/999999999 "$TOKEN_A")
check 'missing task' 404 "$(code "$missing_task")"
missing_task_body=$(body "$missing_task")
check '  missing task code' TASK_NOT_FOUND "$(json_string code "$missing_task_body")"

echo '== delete =='
delete_a=$(req DELETE "/tasks/$TASK_A" "$TOKEN_A")
check 'delete' 204 "$(code "$delete_a")"
deleted_detail=$(req GET "/tasks/$TASK_A" "$TOKEN_A")
check 'detail after delete' 404 "$(code "$deleted_detail")"

echo '== CORS =='
ORIGIN="${CORS_ORIGIN:-http://localhost:4200}"
preflight=$(curl -sS -i -X OPTIONS "$API/tasks" \
  -H "Origin: $ORIGIN" -H 'Access-Control-Request-Method: GET')
if grep -qi "^access-control-allow-origin:[[:space:]]*$ORIGIN" <<<"$preflight"; then
  cors_allowed=yes
else
  cors_allowed=no
fi
check "preflight allows $ORIGIN" yes "$cors_allowed"
cors_rejected=$(curl -sS -o /dev/null -w '%{http_code}' -X OPTIONS "$API/tasks" \
  -H 'Origin: http://unknown.example.com' -H 'Access-Control-Request-Method: GET')
check 'preflight rejects an unknown origin' 403 "$cors_rejected"

echo
echo "RESULT: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
