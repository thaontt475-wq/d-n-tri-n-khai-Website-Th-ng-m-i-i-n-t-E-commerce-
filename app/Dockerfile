FROM node:20-alpine

WORKDIR /usr/src/app

# Cài đặt thư viện phụ thuộc
COPY package*.json ./
RUN npm install --production && npm cache clean --force

# Sao chép mã nguồn ứng dụng và phân quyền cho user node (Security Hardening)
COPY --chown=node:node . .

USER node

EXPOSE 3000
CMD ["npm", "start"]
