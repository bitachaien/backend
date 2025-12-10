# using node 18
FROM node:16
RUN NODE_OPTIONS="--max-old-space-size=8192"
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN chmod +x ./bin/start.sh
# setup datetime container
RUN apt-get update && apt-get install -y tzdata
ENV TZ Asia/Ho_Chi_Minh
RUN date
# run the container entry point
CMD ./bin/start.sh