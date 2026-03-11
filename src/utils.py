import os
import pandas as pd
from loguru import logger

def export_anomalies(df, output_dir, anomaly_col='is_anomaly'):
    logger.info("Exporting results...")
    os.makedirs(output_dir, exist_ok=True)
    
    full_path = os.path.join(output_dir, 'processed_dataset.csv')
    df.to_csv(full_path, index=False)
    logger.info(f"Saved full processed dataset to {full_path}")
    
    anomalies_df = df[df[anomaly_col] == 1]
    anomalies_path = os.path.join(output_dir, 'fraud_transactions.csv')
    anomalies_df.to_csv(anomalies_path, index=False)
    logger.info(f"Saved anomalous transactions to {anomalies_path}")
