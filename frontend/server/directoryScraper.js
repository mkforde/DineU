const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

async function scrapeDirectory(uni) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    console.log(`Fetching directory page for UNI: ${uni}`);
    
    // Go directly to UNI page
    await page.goto(`https://directory.columbia.edu/people/uni?code=${uni}`);

    // Extract first name using the exact selector
    const name = await page.$eval("th[colspan='4']", el => {
      const fullName = el.textContent.trim();
      return fullName.split(" ")[0]; // Get first name
    });

    await browser.close();
    return { success: true, name };
  } catch (error) {
    console.error('Directory scraping error:', error);
    await browser.close();
    return { success: false, error: error.message };
  }
}

// Route to get name from UNI
router.get('/:uni', async (req, res) => {
  try {
    const result = await scrapeDirectory(req.params.uni);
    if (result.success) {
      res.json({ success: true, data: { name: result.name } });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 