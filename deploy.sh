#!/bin/sh
# ideas used from https://gist.github.com/motemen/8595451

# show where we are on the machine
pwd
ls -l .

remote=$(git config remote.origin.url)
ga=$(cat .ga | sed s/'$GA_TRACKING_ID'/"$GA_TRACKING_ID"/g)

# make a directory to put the gp-pages branch
echo "Current dist content:"
ls -l "./dist/"

mkdir gh-pages-branch
cd gh-pages-branch

# now lets setup a new repo so we can update the gh-pages branch
git config --global user.email "$GH_EMAIL"
git config --global user.name "$GH_NAME"
git init
git remote add --fetch origin "$remote"

git checkout gh-pages
# delete any old site as we are going to replace it
# Note: this explodes if there aren't any, so moving it here for now
git rm -rf .

# copy over or recompile the new site
cp -a "../dist/." .

# append the analytics/tracking script
sed "s#</body>#$(echo $ga)</body>#" index.html > tmp.html
mv tmp.html index.html

# stage any changes and new files
git add -A
# now commit, ignoring branch gh-pages doesn't seem to work, so trying skip
git commit -m "Deploy to GitHub pages"
# and push, but send any output to /dev/null to hide anything sensitive
git push --force --quiet origin gh-pages

# go back to where we started and remove the gh-pages git repo we made and used
# for deployment
cd ..
rm -rf gh-pages-branch

echo "Finished Deployment!"
