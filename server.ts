import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import csv from 'csv-parser';

// Install Python dependencies on startup
try {
  console.log('Installing Python dependencies...');
  import('child_process').then(({ execSync }) => {
     try {
       console.log('Downloading get-pip.py...');
       execSync('curl -sS https://bootstrap.pypa.io/get-pip.py -o get-pip.py', { stdio: 'inherit' });
       console.log('Installing pip...');
       execSync('python3 get-pip.py --break-system-packages', { stdio: 'inherit' });
       console.log('Installing dependencies...');
       execSync('python3 -m pip install pandas numpy scikit-learn matplotlib seaborn loguru --break-system-packages', { stdio: 'inherit' });
       console.log('Python dependencies installed successfully.');
     } catch (err) {
       console.error('Failed to install Python dependencies:', err);
     }
  }).catch(e => console.error('Failed to load child_process', e));
} catch (e) {
  console.error('Failed to install Python dependencies', e);
}

const app = express();
const PORT = 3000;

const upload = multer({ dest: 'uploads/' });

app.post('/api/analyze', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { method = 'dbscan', scale = 'standard' } = req.body;
  const inputPath = req.file.path;
  const outputId = req.file.filename;
  const outputDir = path.join(process.cwd(), 'outputs', outputId);

  const cmd = `python3 src/main.py --input ${inputPath} --output ${outputDir} --method ${method} --scale ${scale}`;
  
  exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Python execution error:', stderr);
      return res.status(500).json({ error: 'Failed to process data', details: stderr });
    }

    // Read summary
    try {
      const summaryPath = path.join(outputDir, 'summary.json');
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

      // Read first 50 anomalies
      const anomaliesPath = path.join(outputDir, 'fraud_transactions.csv');
      const anomalies: any[] = [];
      
      if (fs.existsSync(anomaliesPath)) {
        fs.createReadStream(anomaliesPath)
          .pipe(csv())
          .on('data', (data) => {
            if (anomalies.length < 50) anomalies.push(data);
          })
          .on('end', () => {
            res.json({
              id: outputId,
              summary,
              sampleAnomalies: anomalies
            });
          });
      } else {
        res.json({ id: outputId, summary, sampleAnomalies: [] });
      }
    } catch (e) {
      console.error('Error reading results:', e);
      res.status(500).json({ error: 'Failed to read processing results' });
    }
  });
});

app.get('/api/download/:id/:type', (req, res) => {
  const { id, type } = req.params;
  const fileName = type === 'processed' ? 'processed_dataset.csv' : 'fraud_transactions.csv';
  const filePath = path.join(process.cwd(), 'outputs', id, fileName);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

app.get('/api/image/:id', (req, res) => {
  const { id } = req.params;
  const filePath = path.join(process.cwd(), 'outputs', id, 'anomaly_distribution.png');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Image not found');
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  // Global error handler to prevent HTML error pages from Express
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
