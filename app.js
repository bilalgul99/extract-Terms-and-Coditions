const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Function to fetch terms and conditions from the website
const fetchTermsAndConditions = async (url) => {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Searching for terms and conditions link
        const termsLink = $("a:contains('Terms'), a:contains('terms and conditions'), a:contains('Terms of Service')").attr('href');

        if (termsLink) {
            const fullLink = termsLink.startsWith('http') ? termsLink : new URL(termsLink, url).href;
            const { data: termsPage } = await axios.get(fullLink);
            const $terms = cheerio.load(termsPage);
            
            // Extract the body content
            let bodyContent = $terms('body').html();

            // Remove potential header
            bodyContent = bodyContent.replace(/<header.*?<\/header>/is, '');

            // Remove potential footer
            bodyContent = bodyContent.replace(/<footer.*?<\/footer>/is, '');

            // Remove scripts and style tags
            bodyContent = bodyContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            bodyContent = bodyContent.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

            // Convert HTML to plain text
            const plainText = $terms(bodyContent).text();

            // Basic cleaning of the extracted text
            const cleanedText = plainText
                .replace(/\s+/g, ' ')
                .replace(/\n+/g, '\n')
                .trim();

            return cleanedText || "Couldn't extract Terms and Conditions content.";
        } else {
            return "Terms and Conditions link not found.";
        }
    } catch (error) {
        console.error(error);
        return 'Error fetching the website. Please check the URL or try again later.';
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
