@echo off
echo "Running Python Backend Update..."
pip install -r requirements.txt
set PYTHONPATH=%cd%
python scripts/backtest_and_generate.py

echo "Building Next.js Static Export..."
cd frontend
call npm run build
cd ..

echo "Initializing Git & Committing..."
git init 2>nul
git add .
git commit -m "feat: enhance model reliability, 1m CI update, UI & trend chart"
git branch -M main
git remote add origin https://github.com/sbrpgr/kospipreview.git 2>nul

echo "Deploying to Firebase..."
call npx firebase-tools deploy --project kospipreview --only hosting -m "Automated Updates"

echo "Pushing to GitHub..."
git push -u origin main -f

echo "Done!"
