import pandas as pd
import numpy as np

def calculate_errors(matched_df: pd.DataFrame) -> pd.DataFrame:
    '''Calculates strict forecast errors based on matched valid times and locations.'''
    
    # Scalar errors
    matched_df['temperature_error'] = matched_df['forecast_temperature'] - matched_df['obs_temperature']
    matched_df['pressure_error'] = matched_df['forecast_pressure'] - matched_df['obs_pressure']
    
    # Vector Wind Error (Pythagorean)
    matched_df['wind_vector_error'] = np.sqrt(
        (matched_df['forecast_u_wind'] - matched_df['obs_u_wind'])**2 + 
        (matched_df['forecast_v_wind'] - matched_df['obs_v_wind'])**2
    )
    
    return matched_df

def match_forecasts_to_observations(forecast_df: pd.DataFrame, obs_df: pd.DataFrame) -> pd.DataFrame:
    '''
    Strictly joins forecasts and observations on Valid Time, Lat, and Lon.
    Prevents any mixing of forecast and verification data.
    '''
    matched = pd.merge(
        forecast_df, 
        obs_df, 
        on=['valid_time', 'latitude', 'longitude'],
        how='inner',
        suffixes=('_forecast', '_obs')
    )
    return calculate_errors(matched)
