FROM node:latest
ARG BRANCH=main
RUN echo Testing branch ${BRANCH} of CSS
RUN git clone https://github.com/pdsinterop/community-server.git
WORKDIR community-server
RUN git checkout ${BRANCH}
RUN git status
RUN npm install
RUN npm run build
CMD npm run start
