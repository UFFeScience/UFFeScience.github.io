FROM ruby:3.2

WORKDIR /srv/jekyll

COPY Gemfile Gemfile.lock ./
RUN gem install bundler && bundle install

COPY . .

EXPOSE 4000
CMD ["bundle", "exec", "jekyll", "serve", "--watch", "--host", "0.0.0.0"]
