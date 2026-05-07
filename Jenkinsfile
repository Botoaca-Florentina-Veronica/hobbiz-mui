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
                withCredentials([file(credentialsId: 'backend-env-file', variable: 'BACKEND_ENV')]) {
                    sh '''
                        chmod 755 backend
                        rm -f backend/.env
                        cp "$BACKEND_ENV" backend/.env
                    '''
                }
                sh 'docker rm -f hobbiz_mongo hobbiz_backend hobbiz_frontend || true'
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
            sh """
                docker images '${BACKEND_IMAGE}' --format '{{.Tag}}' \
                    | sort -rn | tail -n +4 \
                    | xargs -I{} docker rmi ${BACKEND_IMAGE}:{} || true
                docker images '${FRONTEND_IMAGE}' --format '{{.Tag}}' \
                    | sort -rn | tail -n +4 \
                    | xargs -I{} docker rmi ${FRONTEND_IMAGE}:{} || true
                docker image prune -f || true
            """
        }
    }
}
