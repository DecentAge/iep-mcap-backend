FROM node:14
WORKDIR /app
COPY ./package.json /app
RUN cat /app/package.json
RUN npm install --silent
COPY . /app
RUN npm run-script update-version --release_version=$(cat release-version.txt)
#RUN npm run lint
EXPOSE 8992
ENTRYPOINT ["npm", "run"]
CMD ["start"]