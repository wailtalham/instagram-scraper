const express = require('express');
const router = express.Router();
const InstagramApk = require('../models/InstagramApk'); 
const { checkCompatibility, parseAgentString } = require('../scrapper/instagramScraper'); 

// Check Compatibility
router.post('/check-compatibility', async (req, res) => {
    try {
        const agentString = req.body.agent;
        const { versionId, variantId, androidVersion, dpi } = parseAgentString(agentString);

        // Find the version that contains the variant
        const version = await InstagramApk.findOne({ 'variants.variantId': variantId, version: versionId });

        if (version) {
            // Extract the specific variant from the version
            const variant = version.variants.find(v => v.variantId === variantId);

            if (variant) {
                const isCompatible = checkCompatibility(androidVersion, dpi, variant.minAndroidVersion, variant.dpi);

                if (isCompatible) {
                    res.json({ status: 'success' });
                } else {
                    res.json({ status: 'fail' });
                }
            } else {
                res.status(404).json({ message: 'Variant not found' });
            }
        } else {
            res.status(404).json({ message: 'Version or Variant not found' });
        }
    } catch (error) {
        console.error('Error in /check-compatibility:', error);
        res.status(500).send(error.message);
    }
});

// GET all versions
router.get('/', async (req, res) => {
    try {
        const versions = await InstagramApk.find();
        res.json(versions);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// GET a specific version by id
router.get('/:id', async (req, res) => {
    try {
        const version = await InstagramApk.findById(req.params.id);
        if (!version) return res.status(404).send('Version not found');
        res.json(version);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// POST a new version
router.post('/', async (req, res) => {
    const version = new InstagramApk({
        // Add fields here based on your InstagramApk model
        version: req.body.version,
        releaseDate: req.body.releaseDate,
        variants: req.body.variants
    });

    try {
        const savedVersion = await version.save();
        res.status(201).send(savedVersion);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// PUT - Update a version by id
router.put('/:id', async (req, res) => {
    try {
        const updatedVersion = await InstagramApk.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedVersion) return res.status(404).send('Version not found');
        res.json(updatedVersion);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// DELETE a version by id
router.delete('/:id', async (req, res) => {
    try {
        const version = await InstagramApk.findByIdAndDelete(req.params.id);
        if (!version) return res.status(404).send('Version not found');
        res.json(version);
    } catch (error) {
        res.status(500).send(error.message);
    }
});


module.exports = router;
