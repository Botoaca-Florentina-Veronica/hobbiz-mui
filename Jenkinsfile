pipeline {
    agent any

    tools {
        nodejs 'nodejs'
    }

    environment {
        BACKEND_IMAGE  = 'hobbiz-backend'
        FRONTEND_IMAGE = 'hobbiz-frontend'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Build Backend') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Install & Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Archive Artifact') {
            steps {
                archiveArtifacts artifacts: 'frontend/dist/**/*', fingerprint: true
            }
        }

        stage('Build Docker Images') {
            steps {
                sh "docker build -t ${BACKEND_IMAGE}:${BUILD_NUMBER} ./backend"
                sh "docker build -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} ./frontend"
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker-compose down --remove-orphans || true'
                sh 'docker-compose up -d --build'
            }
        }
    }

    post {
        success {
            echo "Build #${BUILD_NUMBER} deployed successfully."
        }
        failure {
            echo "Build #${BUILD_NUMBER} failed. Check the logs above."
        }
        always {
            echo 'Pipeline finished.'
        }
    }
}
