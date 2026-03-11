import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, OneHotEncoder
from loguru import logger

def handle_missing_values(df):
    logger.info("Handling missing values...")
    df_clean = df.copy()
    for col in df_clean.columns:
        if df_clean[col].isnull().sum() > 0:
            if pd.api.types.is_numeric_dtype(df_clean[col]):
                median_val = df_clean[col].median()
                df_clean[col] = df_clean[col].fillna(median_val)
                logger.debug(f"Filled missing numeric values in {col} with median: {median_val}")
            else:
                mode_val = df_clean[col].mode()[0]
                df_clean[col] = df_clean[col].fillna(mode_val)
                logger.debug(f"Filled missing categorical values in {col} with mode: {mode_val}")
    return df_clean

def convert_data_types(df):
    logger.info("Standardizing data types...")
    df_clean = df.copy()
    for col in df_clean.columns:
        if df_clean[col].dtype == 'object':
            try:
                df_clean[col] = pd.to_numeric(df_clean[col])
                logger.debug(f"Converted {col} to numeric.")
            except ValueError:
                pass
    return df_clean

def encode_categorical_features(df):
    logger.info("Encoding categorical features...")
    df_encoded = df.copy()
    categorical_cols = df_encoded.select_dtypes(include=['object', 'category']).columns.tolist()
    if categorical_cols:
        encoder = OneHotEncoder(sparse_output=False, drop='first')
        encoded_data = encoder.fit_transform(df_encoded[categorical_cols])
        encoded_df = pd.DataFrame(encoded_data, columns=encoder.get_feature_names_out(categorical_cols), index=df_encoded.index)
        df_encoded = pd.concat([df_encoded.drop(columns=categorical_cols), encoded_df], axis=1)
        logger.debug(f"Encoded columns: {categorical_cols}")
    return df_encoded

def scale_features(df, method='standard'):
    logger.info(f"Scaling features using {method} scaler...")
    df_scaled = df.copy()
    numeric_cols = df_scaled.select_dtypes(include=[np.number]).columns.tolist()
    
    if method == 'standard':
        scaler = StandardScaler()
    elif method == 'minmax':
        scaler = MinMaxScaler()
    else:
        raise ValueError("Method must be 'standard' or 'minmax'")
        
    df_scaled[numeric_cols] = scaler.fit_transform(df_scaled[numeric_cols])
    return df_scaled

def smooth_numeric_features(df):
    logger.info("Smoothing numeric features (winsorization)...")
    df_smoothed = df.copy()
    numeric_cols = df_smoothed.select_dtypes(include=[np.number]).columns.tolist()
    for col in numeric_cols:
        lower_bound = df_smoothed[col].quantile(0.01)
        upper_bound = df_smoothed[col].quantile(0.99)
        df_smoothed[col] = np.clip(df_smoothed[col], lower_bound, upper_bound)
    return df_smoothed

def remove_highly_correlated_features(df, threshold=0.9):
    logger.info(f"Removing features with correlation > {threshold}...")
    df_reduced = df.copy()
    numeric_cols = df_reduced.select_dtypes(include=[np.number])
    corr_matrix = numeric_cols.corr().abs()
    upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
    to_drop = [column for column in upper.columns if any(upper[column] > threshold)]
    if to_drop:
        df_reduced = df_reduced.drop(columns=to_drop)
        logger.debug(f"Dropped correlated columns: {to_drop}")
    return df_reduced
