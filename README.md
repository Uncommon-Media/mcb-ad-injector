# UCM Ad Injection Script

This script is designed to dynamically inject advertisements from the Uncommon Media (UCM) ad server onto a target webpage.

## What it Does

In simple terms, this script does the following:

1.  **Loads the Ad Technology:** It first loads the necessary technology from Adhese, our ad serving partner, to make everything work.

2.  **Creates Ad Spaces:** The script then creates several designated "ad slots" or spaces on the page where the ads will appear. This includes:
    *   A horizontal banner ad.
    *   A vertical banner ad.
    *   Two "floating" ads that stick to the left and right sides of the browser window.

3.  **Fetches and Displays Ads:** Once the ad spaces are created, the script requests the actual ad content (images, etc.) from the UCM ad server and places them into the designated slots.

4.  **Adapts to Your Screen:** The floating ads on the sides of the page are designed to be responsive. If you resize your browser window, they will automatically adjust their position to stay in view without overlapping the main content.

## Configuration

The script has a configuration section that allows a developer to specify where the ads should be placed on a webpage. This allows the script to be adapted for different websites with different layouts. This part of the script requires technical knowledge to modify.