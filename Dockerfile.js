FROM node:16.4.2-alpine
LABEL maintainer="savss624"

COPY ./app/front-end /front-end
WORKDIR /front-end

ARG DEV=false
RUN yarn install && \
    if [ $DEV = "false" ]; \
    then npm run build ; \
    fi && \
    adduser \
    --disabled-password \
    --no-create-home \
    node-user

USER node-user