@echo off
echo "Initializing Git..."
git init
git add .
git commit -m "Initialize project with premium dark UI"
git branch -M main
git remote add origin https://github.com/sbrpgr/kospipreview.git
echo "Pushing to GitHub..."
git push -u origin main -f
echo "Deploying to Firebase..."
npx firebase-tools deploy --project kospipreview --only hosting -m "Automated AI Deployment"
