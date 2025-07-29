# 1. Sử dụng Node.js image
FROM node:20

# 2. Tạo thư mục làm việc trong container
WORKDIR /app

# 3. Copy file package và cài đặt
COPY package*.json ./
RUN npm install --verbose

# 4. Copy toàn bộ project
COPY . .

# 5. Build app
RUN npm run build

# 6. Chạy app
CMD ["node", "dist/main"]

# in log debug
RUN cat /root/.npm/_logs/* || true

