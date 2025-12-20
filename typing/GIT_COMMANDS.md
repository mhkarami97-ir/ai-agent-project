# Git Commands Reference

## Initial Setup

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Typing practice app"

# Add remote repository
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Update Existing Repository

```bash
# Check status
git status

# Add modified files
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push
```

## Common Commands

```bash
# Check current branch
git branch

# View commit history
git log --oneline

# View remote URL
git remote -v

# Pull latest changes
git pull
```

## Tips

- Always commit with descriptive messages
- Push changes regularly
- Use `.gitignore` to exclude unnecessary files
- Check status before committing

## GitHub Pages Deployment

After pushing to GitHub:

1. Go to repository Settings
2. Navigate to Pages section
3. Select `main` branch and `/ (root)` folder
4. Save and wait for deployment
5. Your site will be available at: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

