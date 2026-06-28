FROM node:18-alpine

# Install curl, python3, and ffmpeg
RUN apk add --no-cache curl python3 ffmpeg

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

# Download Linux yt-dlp binary
RUN mkdir -p bin && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o bin/yt-dlp && \
    chmod +x bin/yt-dlp

COPY . .

# Set environment path to use the Linux yt-dlp instead of .exe
ENV YTDLP_PATH=/usr/src/app/bin/yt-dlp

EXPOSE 5000

CMD ["node", "server.js"]
