# taste-it-gent.be script for Hubot

## Installation

Add the package `hubot-tasteit-be` as dependencies in your Hubot `package.json` file by running the command:

    npm install hubot-tasteit-be --save

To enable the script, add the `hubot-tasteit-be` entry to the `external-scripts.json` file (you may need to create this file, if it is not present or if you upgraded from Hubot < 2.4).

    ["hubot-tasteit-be"]

## Quick installation of Hubot

To quickly install hubot, run:

    sudo npm install -g hubot coffee-script
    hubot --create mixbot

(mixbot is the name of our hubot)

To test it locally, run

    bin/hubot --name mixbot

Type

    mixbot help

To get an idea of all the available commands

To run it on Campfire, run:

    HUBOT_CAMPFIRE_ACCOUNT="youraccount" HUBOT_CAMPFIRE_ROOMS="474911,537247" HUBOT_CAMPFIRE_TOKEN="sometoken" bin/hubot --name mixbot -a campfire
    
More on the installation of Hubot can be found here: https://github.com/github/hubot/tree/master/docs