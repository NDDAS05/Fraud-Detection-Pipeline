import argparse
import os
import sys
from loguru import logger

from ingestion import load_dataset, summarize_dataset
from preprocessing import (
    handle_missing_values, convert_data_types, encode_categorical_features,
    scale_features, smooth_numeric_features, remove_highly_correlated_features
)
from feature_engineering import create_behavioral_features
from anomaly_detection import train_kmeans, detect_outliers_kmeans, run_dbscan, run_isolation_forest
from evaluation import evaluate_results
from utils import export_anomalies

def setup_logging():
    os.makedirs('logs', exist_ok=True)
    logger.add("logs/pipeline.log", rotation="10 MB", level="INFO")

def main():
    setup_logging()
    
    parser = argparse.ArgumentParser(description="Automated Fraud Detection Pipeline")
    parser.add_argument('--input', type=str, required=True, help="Path to the input CSV dataset")
    parser.add_argument('--output', type=str, default='outputs/anomalies', help="Path to save results")
    parser.add_argument('--method', type=str, choices=['kmeans', 'dbscan', 'isolation_forest'], default='isolation_forest', help="Clustering algorithm")
    parser.add_argument('--scale', type=str, choices=['standard', 'minmax'], default='standard', help="Scaling method")
    parser.add_argument('--eps', type=float, default=0.5, help="DBSCAN epsilon value")
    parser.add_argument('--min_samples', type=int, default=5, help="DBSCAN min_samples value")
    
    args = parser.parse_args()
    
    logger.info("=== Starting Fraud Detection Pipeline ===")
    
    try:
        # 1. Ingestion
        df = load_dataset(args.input)
        summarize_dataset(df)
        
        # 2. Preprocessing
        df_clean = handle_missing_values(df)
        df_clean = convert_data_types(df_clean)
        df_clean = smooth_numeric_features(df_clean)
        df_clean = encode_categorical_features(df_clean)
        df_clean = remove_highly_correlated_features(df_clean)
        
        # 3. Feature Engineering
        df_fe = create_behavioral_features(df_clean)
        
        # 4. Scaling
        df_scaled = scale_features(df_fe, method=args.scale)
        
        # 5. Anomaly Detection
        if args.method == 'kmeans':
            model = train_kmeans(df_scaled)
            anomalies = detect_outliers_kmeans(df_scaled, model)
        elif args.method == 'dbscan':
            anomalies = run_dbscan(df_scaled, eps=args.eps, min_samples=args.min_samples)
        elif args.method == 'isolation_forest':
            # 1% contamination is a standard starting point for fraud detection
            anomalies = run_isolation_forest(df_scaled, contamination=0.01)
            
        # Append results
        df['is_anomaly'] = anomalies
        df_scaled['is_anomaly'] = anomalies
        
        # 6. Evaluation
        evaluate_results(df, output_dir=args.output)
        
        # 7. Export
        export_anomalies(df, output_dir=args.output)
        
        logger.info("=== Pipeline Completed Successfully ===")
        
    except Exception as e:
        logger.exception(f"Pipeline failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
