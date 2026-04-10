# DevOps Capstone Project

End-to-end DevOps pipeline for a Node.js web application using **GitHub, Jenkins, Docker, AWS EC2, Prometheus, Grafana, Bash, and Cron**.

## Project Overview

This project demonstrates a complete DevOps workflow:

- Build and test a Node.js application locally
- Push source code to GitHub
- Automate build and deployment with Jenkins
- Containerize the application using Docker
- Push the Docker image to Docker Hub
- Deploy the container on an AWS EC2 instance
- Monitor the server using Prometheus, Node Exporter, and Grafana
- Automate backup and log cleanup using shell scripts and cron jobs

## Tech Stack

- **Source Control:** Git, GitHub
- **CI/CD:** Jenkins
- **Application:** Node.js, Express.js
- **Containerization:** Docker, Docker Hub
- **Cloud Platform:** AWS EC2
- **Monitoring:** Prometheus, Node Exporter, Grafana
- **Automation:** Bash, Cron

---

## Step 1: Create and Test the Node.js Application

Before pushing code to GitHub, the application was tested locally to confirm it was working correctly.

### Initialize the project

```bash
mkdir devops-capstone
cd devops-capstone
npm init -y
```

This command creates a `package.json` file automatically with default values.

### What is `package.json`?

`package.json` is the main configuration file for a Node.js project. It stores:

- Project name
- Version
- Dependencies
- Scripts such as `start` and `test`
- Author information
- License

### Install Express

```bash
npm install express
```

This command installs **Express.js**, a popular Node.js web framework.

### What happens internally?

When you run `npm install express`, it:

1. Downloads Express from the npm registry
2. Creates the `node_modules` folder
3. Adds Express under `dependencies` in `package.json`
4. Updates `package-lock.json`

After local testing, the code was pushed successfully to GitHub.

---

## Step 2: Create AWS EC2 Instances

Two EC2 instances were created for this project.

### EC2 Instance 1: Jenkins Server

Used for:

- Jenkins installation
- CI/CD pipeline management

### Why use Jenkins on a separate EC2 instance?

Jenkins is deployed on a separate EC2 instance to isolate CI/CD processes from the application server. This provides several benefits:

- Better security
- No resource conflicts with the application server
- Easier scaling
- More reliable deployment automation

### Real-world benefit

In real production environments:

- One Jenkins server can manage multiple applications
- Multiple environments may exist such as development, testing, and production
- Multiple deployment targets can be handled from one place

### EC2 Instance 2: Application and Monitoring Server

Used for:

- Docker
- Prometheus on port `9090`
- Node Exporter on port `9100`
- Grafana on port `3001`
- Shell scripts
- Cron jobs

---

## Step 3: Configure Jenkins Node (Agent)

To allow Jenkins to communicate with the second EC2 instance, a Jenkins node/agent was configured using SSH.

### Important node settings

- **Node Name:** Any meaningful name
- **Remote Root Directory:** Directory created on the Jenkins agent system
- **Label:** Used in the Jenkins pipeline to target the correct agent
- **Launch Method:** Launch agent via SSH

### SSH configuration

- **Host:** Public IP of the EC2 agent instance
- **Credentials ID:** Any chosen ID in Jenkins
- **Username:** EC2 instance username
- **Private Key:** PEM key file used for the EC2 instance

---

## Step 4: Create the Jenkins Pipeline

A Jenkins pipeline project was created to automate the build and deployment flow.

### Pipeline workflow

1. Pull code from GitHub
2. Build the Docker image
3. Log in to Docker Hub
4. Push the image to Docker Hub
5. Pull the image from Docker Hub
6. Deploy the Docker container

### GitHub credentials

If the GitHub repository is private, credentials must be added in Jenkins before pulling the source code.

### Docker Hub credentials

Docker Hub credentials must also be added in Jenkins.  
A Docker Hub access token with **read and write** permission can be used.

After the pipeline runs successfully, the Docker image becomes available in the Docker Hub repository.

### Application URL

After deployment, the application can be accessed using:

```text
http://65.2.188.18:3000/
```

---

## Jenkins Pipeline Code

```groovy
pipeline {
    agent {
        label 'docker'
    }

    environment {
        IMAGE_NAME = 'capestoneapp:v1'
        DOCKERHUB_CREDENTIALS = 'dockerhub-tocken'
        DOCKERHUB_REPO = 'suryasivaraj18/devops-capstone-project'
    }

    stages {
        stage('CodeCheck') {
            steps {
                git branch: 'main', credentialsId: 'gittoken', url: 'https://github.com/suryasivaraj18/EMC_Capstone_Project.git'
            }
        }

        stage('BuildImage') {
            steps {
                sh 'whoami'
                sh 'docker build -t $IMAGE_NAME .'
            }
        }

        stage('Docker Login and Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CREDENTIALS}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker tag $IMAGE_NAME $DOCKERHUB_REPO:latest
                        docker push $DOCKERHUB_REPO:latest
                    '''
                }
            }
        }

        stage('Pull Docker Image') {
            steps {
                sh 'docker pull $DOCKERHUB_REPO:latest'
            }
        }

        stage('Deploy Docker Container') {
            steps {
                sh 'docker run -d -p 3000:3000 --name emc-capstone-project $DOCKERHUB_REPO:latest'
            }
        }
    }
}
```

---

## Step 5: Monitoring Setup

Prometheus, Node Exporter, and Grafana were installed on the EC2 application server.

### Components

- **Prometheus:** Collects metrics
- **Node Exporter:** Exposes Linux system metrics
- **Grafana:** Visualizes metrics using dashboards

### Monitoring tasks completed

- Installed Prometheus
- Installed Node Exporter
- Installed Grafana
- Connected Grafana to Prometheus using a data source
- Created a dashboard to monitor the EC2 instance
- Created an alert for CPU usage monitoring

---

## Step 6: Backup Automation

A backup script was created to archive application data automatically.

### Create sample application data

```bash
mkdir -p /home/ubuntu/appdata
echo "This is sample app data" > /home/ubuntu/appdata/sample.txt
```

### Backup script

```bash
#!/bin/bash

BACKUP_DIR="/home/ubuntu/backups"
SOURCE_DIR="/home/ubuntu/appdata"
DATE=$(date +%F-%H-%M-%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/app-backup-$DATE.tar.gz $SOURCE_DIR

echo "Backup completed: app-backup-$DATE.tar.gz"
```

### Script explanation

- `#!/bin/bash` tells Linux to run the script using the Bash shell
- `BACKUP_DIR` defines where backup files will be stored
- `SOURCE_DIR` defines which folder should be backed up
- `DATE=$(date +%F-%H-%M-%S)` creates a timestamp for unique backup filenames
- `mkdir -p $BACKUP_DIR` creates the backup folder if it does not exist
- `tar -czf` compresses the source directory into a `.tar.gz` archive

---

## Step 7: Log Cleanup Automation

A log cleanup script was created to remove `.log` files older than 7 days.

### Create log directory

```bash
sudo mkdir -p /var/log/myapp
```

### Cleanup script

```bash
#!/bin/bash

LOG_DIR="/var/log/myapp"
find $LOG_DIR -type f -name "*.log" -mtime +7 -delete

echo "Old logs older than 7 days deleted"
```

### Permissions

After creating the script, execution permission must be given:

```bash
sudo chmod +x cleanup_logs.sh
```

> Note: Using `chmod +x` is safer and cleaner than using `chmod 777`.

---

## Step 8: Cron Job Automation

Cron jobs were used to automate:

- Periodic backups
- Automatic deletion of old log files

Example crontab entry:

```bash
crontab -e
```

You can then add scheduled tasks such as:

```cron
0 2 * * * /home/ubuntu/backup.sh
0 3 * * * /home/ubuntu/cleanup_logs.sh
```

This means:

- Run the backup script every day at 2:00 AM
- Run the cleanup script every day at 3:00 AM

---

## Architecture Summary

The complete flow of this project is:

1. Developer writes and tests code locally
2. Code is pushed to GitHub
3. Jenkins pulls the code from GitHub
4. Jenkins builds the Docker image
5. Jenkins pushes the image to Docker Hub
6. Jenkins pulls and deploys the image on the target server
7. Prometheus and Node Exporter collect system metrics
8. Grafana displays dashboards and alerts
9. Cron jobs automate backups and log cleanup

---

## Key Learning Outcomes

Through this project, the following DevOps concepts were implemented:

- CI/CD pipeline creation using Jenkins
- Docker image build and deployment
- Docker Hub integration
- AWS EC2 based infrastructure setup
- Monitoring with Prometheus and Grafana
- Alerting for system health
- Shell scripting for automation
- Cron job scheduling for routine operations

---

## Conclusion

This DevOps Capstone Project demonstrates how to build an end-to-end deployment pipeline for a Node.js application. It covers source control, CI/CD, containerization, cloud deployment, monitoring, alerting, backup automation, and log maintenance in a practical workflow suitable for learning real-world DevOps practices.
