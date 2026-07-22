Grimoire

A self-hosted bookmarking and blogging platform built as a hands-on learning project to understand modern web development, Docker, Linux, and production deployment.

I wanted to understand what happens beyond the infrastructure side. Grimoire was built to bridge that gap by learning how to build, containerize, deploy, and maintain a full-stack application in a production-like environment. AI accelerated the learning process, while every deployment, configuration, and production issue was implemented and verified hands-on.

Tech Stack
Frontend: Next.js, React, TypeScript
Backend: Flask, Gunicorn
Database: MariaDB
Infrastructure: Docker, Nginx, AlmaLinux
Services: Amazon SES, GitHub

Deployment overview

                 Internet
                     │
              HTTPS (443)
                     │
                ┌──────────┐
                │  Nginx   │
                └────┬─────┘
          ┌──────────┴──────────┐
          │                     │
      Frontend                Backend
          |                     |
    Next.js :3000         Flask :5051
          │                     │
          └──────────┬──────────┘
                     │
                 MariaDB
                 
Quick deployment

git clone https://github.com/abhsk-git/grimoire2.git

cd grimoire2

cp api/config/.env.example api/config/.env

cp docker-compose.example.yml docker-compose.yml

docker compose up -d --build

Nginx configuration

    server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        proxy_pass http://127.0.0.1:5051;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    }
