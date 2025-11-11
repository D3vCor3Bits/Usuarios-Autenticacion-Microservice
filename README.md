<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Microservicio de Usuarios y Autenticación para Douremember. Este servicio gestiona todo el flujo de autenticación, registro de usuarios, gestión de roles (paciente, cuidador, médico, administrador), relaciones entre usuarios y el historial de ingresos.

## Características

- 🔐 Autenticación con Supabase Auth
- 👥 Gestión de usuarios multi-rol (paciente, cuidador, médico, administrador)
- 🔗 Relaciones entre usuarios (paciente-médico, paciente-cuidador)
- 📧 Sistema de invitaciones por correo
- 📝 Historial de ingresos
- 🔌 Integración con NATS para comunicación entre microservicios
- 🗄️ Persistencia en PostgreSQL usando Supabase

## Variables de Entorno

Crea un archivo `.env` basado en `.env.template`:

```bash
PORT=3002

# NATS Configuration
NATS_SERVERS=nats://localhost:4222

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# Encryption (para tokens de invitación)
TOKEN_SECRET=your_32_character_secret_key
```

## Requisitos Previos

### Servidor NATS

Es **importante** tener un servidor NATS corriendo en Docker:

```bash
docker run -d --name nats-main -p 4222:4222 -p 8222:8222 nats
```

Este comando levanta un contenedor NATS que expone:
- Puerto `4222`: Para conexiones de clientes
- Puerto `8222`: Para monitoreo HTTP

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
$ npm run start:dev
```

## Estructura del Proyecto

```
src/
├── usuarios-autenticacion/
│   ├── dto/                    # Data Transfer Objects
│   ├── usuarios-autenticacion.controller.ts
│   └── usuarios-autenticacion.service.ts
├── common/
│   ├── exceptions/             # Excepciones personalizadas
│   └── pipes/                  # Pipes de validación
├── config/
│   └── envs.ts                 # Configuración de variables de entorno
└── transports/
    └── nats.module.ts          # Configuración de NATS
```
