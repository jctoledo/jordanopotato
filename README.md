# jordanopotato

An AI-powered conversational application that simulates a psychological consultation using principles inspired by Jordan Peterson's frameworks and the Self-Authoring program. The application provides empathetic and insightful interactions to help users achieve greater clarity and personal growth.

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Setting Up Environment Variables](#setting-up-environment-variables)
- [Running the Application Locally](#running-the-application-locally)
- [Deployment to Heroku](#deployment-to-heroku)
- [Developer Notes](#developer-notes)
- [Acknowledgments](#acknowledgments)

## Project Overview

This project consists of a FastAPI backend and a React frontend (not included here). The backend leverages OpenAI's GPT-4 model via the LangChain library to generate conversational responses. It also uses PostgreSQL for database operations, managed through `psycopg2`.

## Prerequisites

- Python 3.8 or higher
- Node.js 14.x or higher (for the frontend)
- PostgreSQL database
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) (for deployment)
- OpenAI API Key

## Installation

### Clone the Repository

```bash
git clone https://github.com/yourusername/jordanopotato.git
cd jordanopotato
```

### Create a Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

### Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### Install Frontend Dependencies

The frontend is located in the `frontend` directory (not included here). Navigate to that directory and install the dependencies:

```bash
cd frontend
npm install
```

## Setting Up Environment Variables

The application requires several environment variables to function correctly. These can be set in a `.env` file in the root directory or configured directly in your environment.

### Required Variables

- `MY_OPENAI_KEY`: Your OpenAI API key.
- `DATABASE_URL`: The connection string for your PostgreSQL database.

### Creating a `.env` File

Create a `.env` file in the root directory and add the following:

```dotenv
MY_OPENAI_KEY=your-openai-api-key
DATABASE_URL=your-database-url
```

**Note:** Do not commit the `.env` file to version control. It's included in `.gitignore` to prevent sensitive information from being exposed.

## Running the Application Locally

### Initialize the Database

Ensure your PostgreSQL database is running and accessible via the `DATABASE_URL`. The application will automatically create the necessary tables on startup.

### Start the Backend Server

```bash
uvicorn main:app --reload
```

The backend server will start on `http://127.0.0.1:8000/`.

### Start the Frontend Development Server

In a new terminal window, navigate to the `frontend` directory:

```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000/` and will proxy API requests to the backend.

## Deployment to Heroku

### Login to Heroku CLI

```bash
heroku login
```

### Create a New Heroku App

```bash
heroku create your-app-name
```

### Set Environment Variables on Heroku

```bash
heroku config:set MY_OPENAI_KEY=your-openai-api-key
heroku config:set DATABASE_URL=your-database-url
```

### Add Buildpacks

For Heroku to recognize both Python and Node.js, you need to set the buildpacks:

```bash
heroku buildpacks:set heroku/nodejs
heroku buildpacks:add heroku/python
```

### Deploy to Heroku

```bash
git add .
git commit -m "Prepare for Heroku deployment"
git push heroku main
```

### Run Database Migrations

If needed, you can run database initialization commands via Heroku's CLI:

```bash
heroku run python main.py
```

### Access Your App

Your app will be available at `https://your-app-name.herokuapp.com`.

## Developer Notes

### Switching Computers or Environments

If you're setting up the project on a new machine:

1. **Clone the Repository**: As shown in the [Installation](#installation) section.
2. **Set Up Environment Variables**: Ensure your `.env` file is correctly configured.
3. **Install Dependencies**: Both backend and frontend dependencies need to be installed.
4. **Initialize the Database**: Make sure your `DATABASE_URL` points to a valid PostgreSQL instance.
5. **Run the Application**: Start both the backend and frontend servers.

### Updating Dependencies

If you need to update or add dependencies:

- For Python packages, update `requirements.txt`:

  ```bash
  pip install new-package
  pip freeze > requirements.txt
  ```

- For Node.js packages, update `package.json` in the `frontend` directory.

### Important Files

- **`main.py`**: The entry point of the backend application.
- **`jordan_prompt.py`**: Contains the default prompt template used by the AI.
- **`Procfile`**: Specifies the commands that are executed by Heroku.
- **`requirements.txt`**: Lists all Python dependencies.
- **`.gitignore`**: Specifies files and directories to be ignored by Git.
- **`.env`**: Contains environment variables (should not be committed to Git).

## Acknowledgments

- [OpenAI](https://openai.com) for the GPT-4 model.
- [LangChain](https://github.com/hwchase17/langchain) for conversational AI utilities.
- [FastAPI](https://fastapi.tiangolo.com/) for the web framework.
- [Heroku](https://www.heroku.com/) for hosting services.
