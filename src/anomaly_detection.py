import pandas as pd
import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import NearestNeighbors
from loguru import logger

def train_kmeans(df, n_clusters=2):
    logger.info(f"Training K-Means with {n_clusters} clusters...")
    model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    model.fit(df)
    return model

def detect_outliers_kmeans(df, model, threshold_percentile=95):
    logger.info("Detecting anomalies using K-Means...")
    distances = model.transform(df)
    min_distances = distances.min(axis=1)
    threshold = np.percentile(min_distances, threshold_percentile)
    is_anomaly = (min_distances > threshold).astype(int)
    return is_anomaly

def run_dbscan(df, eps=0.5, min_samples=5):
    # Prevent DBSCAN from running on massive datasets to avoid OOM and timeouts
    if len(df) > 100000:
        logger.error(f"Dataset too large for DBSCAN ({len(df)} rows). Max recommended is 100,000.")
        raise ValueError(f"Dataset too large for DBSCAN ({len(df)} rows). Please use Isolation Forest or K-Means for datasets over 100,000 rows, or upload a smaller sample.")

    if eps == 0.5:
        logger.info("Default eps=0.5 detected. Estimating optimal eps for high-dimensional data...")
        # Use a sample to speed up the estimation
        sample_size = min(10000, len(df))
        df_sample = df.sample(sample_size, random_state=42) if len(df) > sample_size else df
        
        nn = NearestNeighbors(n_neighbors=min_samples)
        nn.fit(df_sample)
        distances, _ = nn.kneighbors(df_sample)
        
        # Sort distances to the k-th nearest neighbor
        k_distances = np.sort(distances[:, -1])
        
        # Set eps to the 95th percentile distance (assuming ~5% anomalies)
        eps = np.percentile(k_distances, 95)
        logger.info(f"Estimated optimal eps: {eps:.4f}")

    logger.info(f"Running DBSCAN with eps={eps:.4f}, min_samples={min_samples}...")
    model = DBSCAN(eps=eps, min_samples=min_samples, n_jobs=None)
    labels = model.fit_predict(df)
    is_anomaly = (labels == -1).astype(int)
    return is_anomaly

def run_isolation_forest(df, contamination=0.01):
    logger.info(f"Running Isolation Forest with contamination={contamination}...")
    model = IsolationForest(contamination=contamination, random_state=42, n_jobs=None)
    labels = model.fit_predict(df)
    is_anomaly = (labels == -1).astype(int)
    return is_anomaly
