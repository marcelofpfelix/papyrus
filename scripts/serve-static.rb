#!/usr/bin/env ruby
# frozen_string_literal: true

require "webrick"

root = File.expand_path(ARGV[0] || "dist")
port = Integer(ARGV[1] || "4326")
host = ARGV[2] || "127.0.0.1"

server = WEBrick::HTTPServer.new(
  BindAddress: host,
  DocumentRoot: root,
  Port: port,
  AccessLog: [[STDOUT, WEBrick::AccessLog::COMMON_LOG_FORMAT]],
  Logger: WEBrick::Log.new(STDERR, WEBrick::Log::INFO)
)

server.mount_proc("/") do |request, response|
  path = WEBrick::HTTPServlet::FileHandler.new(server, root)
  path.service(request, response)
rescue WEBrick::HTTPStatus::NotFound
  fallback = File.join(root, "404.html")
  raise unless File.file?(fallback)

  response.status = 404
  response["Cache-Control"] = "no-store"
  response["Content-Type"] = "text/html"
  response.body = File.binread(fallback)
end

trap("INT") { server.shutdown }
trap("TERM") { server.shutdown }

puts "Serving #{root} at http://#{host}:#{port}/"
server.start
