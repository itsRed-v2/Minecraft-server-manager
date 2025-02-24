FROM amazoncorretto:23

# installing nodejs
RUN curl -fsSL https://rpm.nodesource.com/setup_23.x -o nodesource_setup.sh \
	&& bash nodesource_setup.sh \
	&& yum install -y nodejs \
	&& rm nodesource_setup.sh

# installing ps (useful for debugging processes)
RUN yum -y install procps-ng

# installing npm packages
WORKDIR /code
COPY package.json /code/package.json
COPY package-lock.json /code/package-lock.json
RUN npm ci
