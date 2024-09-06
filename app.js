const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Function to fetch terms and conditions from the website
const fetchTermsAndConditions = async (url) => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0' });
        console.log("Navigated to terms and conditions page");

        // Searching for terms and conditions link
        const termsLink = await page.evaluate(() => {
            const link = document.querySelector("a[href*='terms'], a[href*='conditions']");
            console.log("Terms and conditions link found");
            console.log(link.hrefS);
            return link ? link.href : null;
        });
        console.log("Terms and conditions link found");
        console.log(termsLink);

        if (termsLink) {
            await page.goto(termsLink, { waitUntil: 'networkidle0' });
            console.log("Navigated to terms and conditions page");
            // Extract the content
            let content = await page.evaluate(() => {
                console.log("Evaluating page content");
                // First, try to find an element with 'main' in its id or class
                const mainElement = document.querySelector('[id*="main" i], [class*="main" i]');
                
                if (mainElement) {
                    console.log("Main element found");
                    return mainElement.innerText;
                } else {
                    // If no 'main' element found, fall back to body content
                    console.log("Main element not found");
                    const elementsToRemove = document.querySelectorAll('header, footer, script, style');
                    elementsToRemove.forEach(el => el.remove());
                    return document.body.innerText;
                }
            });

            // Basic cleaning of the extracted text
            const cleanedText = content.trim();

            return cleanedText || "Couldn't extract Terms and Conditions content.";
        } else {
            return "Terms and Conditions link not found.";
        }
    } catch (error) {
        console.error(error);
        return 'Error fetching the website. Please check the URL or try again later.';
    } finally {
        if (browser) await browser.close();
    }
};

// Endpoint for the front-end to fetch terms and conditions
app.post('/fetch-terms', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).send('No URL provided');
    }

    const termsText = await fetchTermsAndConditions(url);
    res.send({ terms: termsText });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
