const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const InstagramApk = require('../models/InstagramApk'); 

const BASE_URL = 'https://www.apkmirror.com';

async function fetchInstagramApks() {
    let currentPage = 1;
    let apkLinks = [];
    let allVersionsFetched = false;
    let retries = 0;

    while (!allVersionsFetched && retries < 5) {
        try {
            const $ = currentPage === 1
                ? await axios.get(`${BASE_URL}/apk/instagram/instagram-instagram/`).then(response => cheerio.load(response.data))
                : await fetchMoreApkVersions(currentPage);

            if (!$) break;

            $('.appRow').each((i, element) => {
                if (apkLinks.length >= 10) {
                    allVersionsFetched = true;
                    return false; // Break out of the each loop
                }

                const title = $(element).find('.appRowTitle a').text();
                const detailPageUrl = BASE_URL + $(element).find('.appRowTitle a').attr('href');

                // Check if the URL is for the Instagram app and skip alpha/beta versions
                if (detailPageUrl.includes('/apk/instagram/instagram-instagram/') && 
                    !title.toLowerCase().includes('alpha') && 
                    !title.toLowerCase().includes('beta')) {
                    apkLinks.push(detailPageUrl);
                } else {
                    console.log('Skipping non-Instagram or alpha/beta URL:', detailPageUrl);
                }
            });

            if (apkLinks.length >= 10) {
                allVersionsFetched = true;
                break;
            }

            currentPage++;
            retries = 0;
        } catch (error) {
            console.error('Error fetching APK data, retrying...', error);
            throw error;
        }
    }

    apkLinks = apkLinks.slice(0, 10); // Ensure no more than 10 links

    for (const url of apkLinks) {
        await scrapeVariantDetails(url);
    }
}


async function scrapeVariantDetails(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Check if the page is an Instagram app page
        if (!$('.appRowTitle').text().toLowerCase().includes('instagram')) {
            console.error('Skipping non-Instagram app:', url);
            return;
        }

        const versionElement = $('.table-cell:first-child a').first();
        const version = versionElement.length ? versionElement.text().trim() : '';
        if (!version) {
            console.error('Version not found for URL:', url);
            return;
        }
        console.log('Extracted version:', version);

        const releaseDateElement = $('.table-cell:first-child .dateyear_utc');
        const releaseDate = releaseDateElement.length ? releaseDateElement.attr('data-utcdate').trim() : '';
        if (!releaseDate) {
            console.error('Release date not found for URL:', url);
            return;
        }

        let variants = [];
        $('.variants-table .table-row').each((i, element) => {
            if (i === 0) return; // Skip the header row

            const variantId = $(element).find('.table-cell').first().find('.colorLightBlack').first().text().trim();
            const architecture = $(element).find('.table-cell:nth-child(2)').text().trim();
            const minAndroidVersion = $(element).find('.table-cell:nth-child(3)').text().trim();
            const dpi = $(element).find('.table-cell:nth-child(4)').text().trim();

            if (variantId && architecture && minAndroidVersion && dpi) {
                variants.push({ variantId, architecture, minAndroidVersion, dpi });
            }
        });

        if (variants.length === 0) {
            console.error('No variants found for URL:', url);
            return;
        }

        const apkData = new InstagramApk({ version, releaseDate, variants });
        await apkData.save();
    } catch (error) {
        console.error(`Error scraping variants from ${url}:`, error);
        throw error;
    }
}

async function fetchMoreApkVersions(currentPage) {
    const url = `https://www.apkmirror.com/uploads/page/${currentPage}/?appcategory=instagram-instagram`;
    try {
        const response = await axios.get(url);
        return cheerio.load(response.data);
    } catch (error) {
        console.error('Error fetching additional APK versions:', error);
        throw error;
        /* return null; */
    }
}

function parseAgentString(agent) {
    const pattern = /Instagram\s+([\d\.]+)\s+Android\s+\(([\d\/]+); (\d+)dpi;.* (\d+)\)/;
    const match = agent.match(pattern);
    if (match) {
        return {
            versionId: match[1],
            androidVersion: match[2],
            dpi: parseInt(match[3], 10),
            variantId: match[4]
        };
    } else {
        throw new Error('Agent string format is incorrect');
    }
}


function checkCompatibility(requestedAndroidVersion, requestedDpi, minAndroidVersion, variantDpi) {
    // Convert version strings to numbers for comparison
    const requestedVersionNumber = parseInt(requestedAndroidVersion.split('.')[0]); // Assuming we only care about the major version
    const minVersionNumber = parseInt(minAndroidVersion.split('.')[0]);

    // Check if the requested Android version is greater than or equal to the minimum required version
    const isAndroidVersionCompatible = requestedVersionNumber >= minVersionNumber;

    // Check if the requested DPI is within the acceptable range
    const [minDpi, maxDpi] = variantDpi.split('-').map(Number);
    const isDpiCompatible = requestedDpi >= minDpi && requestedDpi <= maxDpi;

    return isAndroidVersionCompatible && isDpiCompatible;
}
/* fetchInstagramApks(); */

module.exports = { fetchInstagramApks, checkCompatibility, parseAgentString };
