import matplotlib.pyplot as plt
import seaborn as sns
from loguru import logger
import os

def evaluate_results(df, anomaly_col='is_anomaly', output_dir='outputs/anomalies'):
    logger.info("Evaluating results...")
    total_transactions = len(df)
    flagged_anomalies = df[anomaly_col].sum()
    normal_transactions = total_transactions - flagged_anomalies
    anomaly_ratio = (flagged_anomalies / total_transactions) * 100
    
    logger.info(f"Total transactions: {total_transactions}")
    logger.info(f"Normal transactions: {normal_transactions}")
    logger.info(f"Flagged anomalies: {flagged_anomalies}")
    logger.info(f"Anomaly ratio: {anomaly_ratio:.2f}%")
    
    print(f"\n--- Evaluation Metrics ---")
    print(f"Total transactions: {total_transactions}")
    print(f"Normal transactions: {normal_transactions}")
    print(f"Flagged anomalies: {flagged_anomalies}")
    print(f"Anomaly ratio: {anomaly_ratio:.2f}%\n")
    
    try:
        os.makedirs(output_dir, exist_ok=True)
        plt.figure(figsize=(8, 6))
        sns.countplot(x=anomaly_col, data=df)
        plt.title('Distribution of Normal vs Anomalous Transactions')
        plt.savefig(os.path.join(output_dir, 'anomaly_distribution.png'))
        plt.close()
        logger.info("Saved anomaly distribution plot.")
        
        import json
        summary = {
            "total_transactions": int(total_transactions),
            "normal_transactions": int(normal_transactions),
            "flagged_anomalies": int(flagged_anomalies),
            "anomaly_ratio": float(anomaly_ratio)
        }
        with open(os.path.join(output_dir, 'summary.json'), 'w') as f:
            json.dump(summary, f)
        logger.info("Saved summary.json")
    except Exception as e:
        logger.warning(f"Could not generate plot or summary: {e}")
