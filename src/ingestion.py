import pandas as pd
import os
from loguru import logger

def validate_dataset(file_path):
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        raise FileNotFoundError(f"File not found: {file_path}")
    # Removed the strict .endswith('.csv') check because Node.js (multer) 
    # saves temporary uploads without file extensions.
    return True

def load_dataset(file_path):
    validate_dataset(file_path)
    logger.info(f"Loading dataset from {file_path}")
    df = pd.read_csv(file_path)
    return df

def summarize_dataset(df):
    logger.info(f"Dataset shape: {df.shape}")
    logger.info(f"Columns: {df.columns.tolist()}")
    logger.info(f"Data types:\n{df.dtypes}")
    logger.info(f"First 5 rows:\n{df.head()}")
