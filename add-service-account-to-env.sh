#!/bin/bash

echo "✅ Service Account JSON 파일 파싱 완료!"
echo ""
echo "📝 .env.local에 다음 내용을 추가하세요:"
echo "====================================="
echo ""
echo "# Google Service Account 설정"
echo 'GOOGLE_SERVICE_ACCOUNT_EMAIL=masgolf-ga4-reader@academic-moon-454803-i8.iam.gserviceaccount.com'
echo ""
echo 'GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8Xz/oq6h7E5NS\n7ej10z1n+GPUmzTE9jZ801isMQ2FlUVGMtnu+3FG+XSRwJ9Z7/9kSSgoxCOyUMks\n9YbCmkAcl9zYFRQrlqTzBUaFc6pM80WG8AKAg1ubns9Cn+SiGPSxzYJRcnKbcQ6K\nXTYzuvT/M2qEKAepmpSGZvLqfDkwfyjSadVRchOTCkz906fsEU9+psri2PWx0rOP\n89U9AXqc0GB3WtAYiUOtokRrC4xTiJfXZjShg2EICaldl4Ceupw43b2FwzhG5jg3\nYoC2av+GI4+AL2FGUIDUya6/+oG6SS6kWGMFZXzIc6ulLtr65bwvmmGRA18PVh97\nQYVVRHu7AgMBAAECggEARJm/kYFqQyA2592imFvMoh+QY63+QriT0VO6mELo9LwO\n1WjReznw3/Ma47WtkrhXXvNRf78mbNsE2K213QsFzCP2Fm9ewB0Fh0dljlY4L/vs\nVx7zGlA8PWlRe6b1QZ8rBdGc4wJ2AGvk6rjVc3Njo8jawrQ9TiPwcR3u2zxQK3uT\nsIXhI2ZI7OjKHkuRr7xAHd/1gPMoZWj9LEGjcWrX1wTKmISQQVYgZVlLtSosvPN4\nyuYNrWdzHriKWlSmEyHvGrbOgJsNgQsJl5JEAPYceHEVsfMuiZ/JPZebs5PfrDbr\ncRAc6ZraqjW9tkKdlnSiTL2tERuzU3KJFRdH+ze6SQKBgQDezuJrmKmj1P1T0YnJ\nOhEJ0JJt25RzQAkprrf4pl3WHCvsF5XYwYWu6dXh4hPjQXlkv7CbviF4IF+Vt6Vj\nflXDkcVN3kwEzCFQAg0UQOiW82GuefLS/araCCZzgNrExwL1qqcc8STa/degLr3j\nqZpJgD3QvhvihlX4a14uOLeYtQKBgQDYbxhQypVw65CKGm7VD1ydZZH7xpfDCq8M\nsVrBjtwXYW7yOF7mIuRJAxBzwZeAfgluguLjLB1lgh+7Co5+/m9a98y1H2ujHakm\n3RzsT9EO82IEsDQpqgwhV1Esbox0iZKpFba+jAtMhKkGMjWAjq2HtwJycGitgkxb\nG/C3B524rwKBgH5auRDnvJyKdzeHhyo04eC9Ba2DbwaE9C1NRkuenWyFAWucXIBW\nDygIuCCngzvHr74w70kDZBup0EspoINx69VC36+vN1EpKmMjJqOrw7uHPogh5FE/\nRhrrsFKkamxZqBYFt0u0fYAroJLYrxti3Xp9XZD5nvqx0CNXUEvKImRZAoGAGvpW\nFJP75rRmMuCymfotOC1V8gVCG3y0byeYQXI2Ou/ZLXYbViJZRESOg29JHCoZsN29\nvEVecK20mNLrCida6ALlUFpXR2DGGeML3OTiETQDLsRr7BmXI3zH0HsDJO+VCWB8\ng+ne6q3Kh8wwYRLnzHfiZTNfyOjp7Z1g9t+LKF8CgYEAkN52EzgJh7DXg7EB5hq2\nZJ7oWg7wTMoBoFdHjGdWx9KE87/An8JE54LqTKEd7IBai1Brrmtfz4Xyqgnts/t+\nKeyPK5TzHlo4ntNhPYxbey1J6UfwB+zUR1P9HjDnXULvfEEVqWsooAVadgJVdktb\nSDuoSVbYVe7JdX8Rq9woyGw=\n-----END PRIVATE KEY-----\n"'
echo ""
echo "====================================="
echo ""
echo "⚠️ 주의사항:"
echo "  - private key는 큰따옴표로 감싸야 합니다"
echo "  - \\n은 그대로 유지해야 합니다"
echo "  - .gitignore에 .env.local이 포함되어 있는지 확인하세요"
echo ""
echo "📝 .env.local 파일 열기:"
echo "  code .env.local"
echo "  또는"
echo "  nano .env.local"
