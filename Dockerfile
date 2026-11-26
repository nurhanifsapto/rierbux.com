FROM node:22-alpine

ENV NODE_ENV=production \
    TZ=Asia/Jakarta

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY rierbux.js dashboard.js dashboard-ui.js webhook.js API_DOCS.md google-apps-script.gs ./
COPY assets ./assets

RUN mkdir -p /app/data
ENV RIERBUX_DATA_DIR=/app/data \
    HEALTH_PORT=3030 \
    DASHBOARD_HOST=0.0.0.0

EXPOSE 3030

CMD ["node", "rierbux.js", "worker"]
