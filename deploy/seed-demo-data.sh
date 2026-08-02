#!/usr/bin/env bash
#
# Seed demo data for the Task Manager UI.
#
# The script uses the public API instead of writing database rows directly, so
# password hashing, validation and ownership rules are exercised as in real use.
#
# Usage (creates a separate demo account by default):
#   deploy/seed-demo-data.sh http://localhost:8080
#   deploy/seed-demo-data.sh https://your-api.example.com
#
# To reuse an existing account, provide both variables. The script will log in
# when that account already exists:
#   SEED_EMAIL=you@example.com SEED_PASSWORD='your-password' deploy/seed-demo-data.sh
#
# Limit the number of tasks created (the default creates the full dataset):
#   SEED_COUNT=6 SEED_EMAIL=you@example.com SEED_PASSWORD='your-password' \
#     deploy/seed-demo-data.sh https://your-api.example.com
#
# Set SEED_DRY_RUN=1 to print the planned dataset without calling the API.

set -euo pipefail

API_ROOT="${1:-http://localhost:8080}"
API="${API_ROOT%/}/api"
DRY_RUN="${SEED_DRY_RUN:-0}"

if [[ "$DRY_RUN" != "1" ]] && ! command -v curl >/dev/null 2>&1; then
  echo 'curl is required.' >&2
  exit 1
fi

date_offset() {
  local days="$1"
  if date -v+0d +%F >/dev/null 2>&1; then
    if [[ "$days" == -* ]]; then
      date -v"${days}d" +%F
    else
      date -v+"${days}d" +%F
    fi
  else
    date -d "${days} days" +%F
  fi
}

TODAY="$(date +%F)"
YESTERDAY="$(date_offset -1)"
TOMORROW="$(date_offset 1)"
IN_THREE_DAYS="$(date_offset 3)"
IN_SEVEN_DAYS="$(date_offset 7)"
LAST_WEEK="$(date_offset -7)"
LAST_MONTH="$(date_offset -30)"

if [[ -n "${SEED_EMAIL:-}" ]]; then
  EMAIL="$SEED_EMAIL"
  PASSWORD="${SEED_PASSWORD:-}"
  if [[ -z "$PASSWORD" ]]; then
    echo 'SEED_PASSWORD must be set when SEED_EMAIL is provided.' >&2
    exit 2
  fi
  ACCOUNT_MODE='existing-or-create'
else
  SEED_ID="$(date +%s)"
  EMAIL="task-manager.demo.${SEED_ID}@example.com"
  PASSWORD="TaskManagerDemo-${SEED_ID}!"
  ACCOUNT_MODE='new-demo'
fi

# Fields: title|description|status|priority|category|dueDate|pin
TASKS=(
  "Ôn tập Spring Boot|Ôn lại REST controller và validation|TODO|HIGH|STUDY|$YESTERDAY|1"
  "Nộp bài Công nghệ web|Kiểm tra README và đường dẫn deploy|TODO|HIGH|STUDY|$TODAY|1"
  "Đọc tài liệu PostgreSQL|Đọc phần migration và index|TODO|LOW|STUDY|$IN_SEVEN_DAYS|0"
  "Dọn inbox email|Xử lý các email chưa đọc|TODO|LOW|PERSONAL||0"
  "Hoàn thiện API tasks|Bổ sung kiểm thử filter và ownership|IN_PROGRESS|HIGH|WORK|$YESTERDAY|1"
  "Rà soát giao diện dashboard|Kiểm tra responsive trên màn hình nhỏ|IN_PROGRESS|MEDIUM|Dự án|$TODAY|0"
  "Viết tài liệu demo|Chuẩn bị các bước trình bày cho thầy|IN_PROGRESS|MEDIUM|WORK|$IN_THREE_DAYS|0"
  "Đặt lịch khám|Gọi phòng khám để xác nhận lịch|IN_PROGRESS|LOW|Sức khỏe||0"
  "Cập nhật hồ sơ cá nhân|Đã cập nhật họ tên trong trang profile|DONE|MEDIUM|PERSONAL|$LAST_WEEK|1"
  "Thiết kế database|Đã chốt bảng users và tasks|DONE|HIGH|Dự án|$LAST_MONTH|0"
  "Mua bàn phím|Đã nhận hàng và kiểm tra sản phẩm|DONE|LOW|Mua sắm|$YESTERDAY|0"
  "Gia hạn gói điện thoại|Đã thanh toán tháng này|DONE|MEDIUM|Tài chính||0"
  "Lên kế hoạch tuần mới|Chọn ba việc quan trọng nhất|TODO|MEDIUM|Kế hoạch|$TOMORROW|0"
  "Tổng vệ sinh phòng|Lau bàn học và sắp xếp tài liệu|TODO|LOW|Việc nhà|$IN_THREE_DAYS|0"
  "Gọi cho gia đình|Hỏi thăm bố mẹ cuối tuần|TODO|MEDIUM|Gia đình|$TOMORROW|0"
  "Tập thể dục|Chạy bộ tối thiểu 30 phút|IN_PROGRESS|MEDIUM|Sức khỏe|$TOMORROW|0"
  "Xem phim cuối tuần|Chọn một bộ phim nhẹ nhàng|TODO|LOW|Giải trí|$IN_SEVEN_DAYS|0"
  "Theo dõi chi phí tháng|Nhập các khoản chi mới nhất|IN_PROGRESS|HIGH|Tài chính|$TODAY|1"
  "Mua rau quả|Mua thực phẩm cho ba ngày|TODO|LOW|Mua sắm|$TODAY|0"
  "Chuẩn bị sinh nhật|Chọn quà và viết lời chúc|IN_PROGRESS|HIGH|Gia đình|$IN_SEVEN_DAYS|0"
  "Việc khác cần xử lý|Một ghi chú không thuộc nhóm cố định|TODO|MEDIUM|Khác||0"
  "Backup mã nguồn|Lưu bản sao trước khi deploy|DONE|HIGH|WORK|$LAST_WEEK|0"
  "Kiểm tra link production|Đã kiểm tra health endpoint|DONE|LOW|Dự án|$YESTERDAY|0"
  "Học Angular signals|Xem lại signal và computed|TODO|MEDIUM|STUDY|$IN_SEVEN_DAYS|0"
)

TOTAL_TASKS=${#TASKS[@]}
SEED_COUNT="${SEED_COUNT:-$TOTAL_TASKS}"
if ! [[ "$SEED_COUNT" =~ ^[1-9][0-9]*$ ]] || (( SEED_COUNT > TOTAL_TASKS )); then
  echo "SEED_COUNT must be an integer between 1 and $TOTAL_TASKS." >&2
  exit 2
fi
TASKS=("${TASKS[@]:0:SEED_COUNT}")

echo "Target API: $API"
echo "Planned tasks: ${#TASKS[@]}"
echo "Date buckets: overdue=$YESTERDAY, today=$TODAY, future=$TOMORROW/$IN_SEVEN_DAYS"

if [[ "$DRY_RUN" == "1" ]]; then
  printf '  %2d. %s\n' 1 "${TASKS[0]%%|*}"
  for ((i = 1; i < ${#TASKS[@]}; i++)); do
    printf '  %2d. %s\n' "$((i + 1))" "${TASKS[$i]%%|*}"
  done
  echo 'Dry run complete; no API calls were made.'
  exit 0
fi

json_string() {
  local key="$1" json="$2"
  sed -nE "s/.*\"$key\"[[:space:]]*:[[:space:]]*\"([^\"]*)\".*/\1/p" <<<"$json" | head -n 1
}

json_number() {
  local key="$1" json="$2"
  sed -nE "s/.*\"$key\"[[:space:]]*:[[:space:]]*([0-9]+).*/\1/p" <<<"$json" | head -n 1
}

request() {
  local method="$1" path="$2" token="${3-}" data="${4-}"
  local -a args=(-sS -w $'\n%{http_code}' -X "$method" "$API$path")
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  [[ -n "$data" ]] && args+=(-H 'Content-Type: application/json' -d "$data")
  curl "${args[@]}"
}

code() { tail -n 1 <<<"$1"; }
body() { sed '$d' <<<"$1"; }

register_payload="$(printf '{"email":"%s","password":"%s","fullName":"Tài khoản demo","phone":"0900000000"}' "$EMAIL" "$PASSWORD")"
register_response="$(request POST /auth/register '' "$register_payload" || true)"
register_code="$(code "$register_response")"

if [[ "$register_code" == '201' ]]; then
  TOKEN="$(json_string accessToken "$(body "$register_response")")"
  echo "Created demo account: $EMAIL"
  echo "Demo password: $PASSWORD"
elif [[ "$register_code" == '409' ]]; then
  login_payload="$(printf '{"email":"%s","password":"%s"}' "$EMAIL" "$PASSWORD")"
  login_response="$(request POST /auth/login '' "$login_payload")"
  if [[ "$(code "$login_response")" != '200' ]]; then
    echo 'The account exists, but login failed. Check SEED_EMAIL/SEED_PASSWORD.' >&2
    exit 1
  fi
  TOKEN="$(json_string accessToken "$(body "$login_response")")"
  echo "Using existing account: $EMAIL"
else
  echo "Could not register seed account (HTTP $register_code): $(body "$register_response")" >&2
  exit 1
fi

if [[ -z "$TOKEN" ]]; then
  echo 'The API did not return an access token.' >&2
  exit 1
fi

created=0
failed=0
for task in "${TASKS[@]}"; do
  IFS='|' read -r title description status priority category due_date pin <<<"$task"
  due_json='null'
  [[ -n "$due_date" ]] && due_json="\"$due_date\""
  payload="$(printf '{"title":"%s","description":"%s","status":"%s","priority":"%s","category":"%s","dueDate":%s}' \
    "$title" "$description" "$status" "$priority" "$category" "$due_json")"
  response="$(request POST /tasks "$TOKEN" "$payload")"
  response_code="$(code "$response")"
  if [[ "$response_code" != '201' ]]; then
    echo "FAIL $title (HTTP $response_code): $(body "$response")" >&2
    failed=$((failed + 1))
    continue
  fi
  task_id="$(json_number id "$(body "$response")")"
  if [[ -z "$task_id" ]]; then
    echo "FAIL $title (response did not contain a task id)" >&2
    failed=$((failed + 1))
    continue
  fi
  if [[ "$pin" == '1' ]]; then
    pin_response="$(request PATCH "/tasks/$task_id/pin" "$TOKEN" '{"pinned":true}')"
    if [[ "$(code "$pin_response")" != '200' ]]; then
      echo "FAIL pin $title (HTTP $(code "$pin_response"))" >&2
      failed=$((failed + 1))
      continue
    fi
  fi
  created=$((created + 1))
  printf '  created %-36s [%s, %s]\n' "$title" "$status" "$category"
done

echo
echo "Seed result: $created created, $failed failed"
echo "Open the dashboard and statistics page to verify filters, pinned tasks and pagination."
[[ "$failed" -eq 0 ]]
