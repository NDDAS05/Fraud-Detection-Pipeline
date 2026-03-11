import pandas as pd
import numpy as np
from loguru import logger

def create_behavioral_features(df):
    logger.info("Creating behavioral features...")
    df_fe = df.copy()
    
    amount_cols = [col for col in df_fe.columns if 'amount' in col.lower()]
    if amount_cols:
        main_amount = amount_cols[0]
        df_fe['Log_' + main_amount] = np.log1p(df_fe[main_amount].clip(lower=0))
        logger.debug(f"Created Log_{main_amount} feature.")
        
    time_cols = [col for col in df_fe.columns if 'time' in col.lower()]
    if time_cols:
        main_time = time_cols[0]
        df_fe['Time_Diff'] = df_fe[main_time].diff().fillna(0)
        logger.debug("Created Time_Diff feature.")
        
    return df_fe
