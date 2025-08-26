/**
 * BUMBA MLOps Specialist
 * Expert in ML operations, model lifecycle management, and automated ML pipelines
 */

const UnifiedSpecialistBase = require('../../unified-specialist-base');

class MLOpsSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'MLOps Specialist',
      expertise: ['ML Operations', 'Model Lifecycle', 'Automated Pipelines', 'Model Governance'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are an MLOps expert specializing in:
        - End-to-end ML pipeline automation
        - Model lifecycle management and governance
        - Continuous integration/deployment for ML
        - Model monitoring and drift detection
        - Feature store management
        - Experiment tracking and model registry
        - Infrastructure as code for ML
        - A/B testing and gradual rollouts
        Always prioritize automation, reliability, and scalability.`
    });

    this.capabilities = {
      pipelineAutomation: true,
      modelGovernance: true,
      cicd: true,
      monitoring: true,
      featureStore: true,
      experimentation: true,
      infrastructure: true,
      compliance: true
    };
  }

  async setupMLOpsPlatform(context) {
    const analysis = await this.analyze(context);
    
    return {
      architecture: this.designMLOpsArchitecture(analysis),
      pipelines: this.createAutomatedPipelines(analysis),
      monitoring: this.setupModelMonitoring(analysis),
      governance: this.implementGovernance(analysis)
    };
  }

  designMLOpsArchitecture(analysis) {
    return {
      components: {
        dataManagement: 'Feature Store + Data Versioning',
        experimentTracking: 'MLflow + Weights & Biases',
        modelRegistry: 'MLflow Model Registry',
        cicd: 'GitHub Actions + Jenkins',
        orchestration: 'Kubeflow Pipelines + Airflow',
        serving: 'Seldon Core + KServe',
        monitoring: 'Evidently AI + Prometheus + Grafana',
        governance: 'ModelDB + Data Lineage Tools'
      },
      infrastructure: this.designInfrastructure(analysis),
      dataFlow: this.designDataFlow(analysis)
    };
  }

  createAutomatedPipelines(analysis) {
    return {
      training: this.createTrainingPipeline(analysis),
      deployment: this.createDeploymentPipeline(analysis),
      retraining: this.createRetrainingPipeline(analysis)
    };
  }

  createTrainingPipeline(analysis) {
    return `# Automated ML Training Pipeline

import mlflow
import mlflow.sklearn
from mlflow.tracking import MlflowClient
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import yaml
import logging
from datetime import datetime
import os

class AutoMLTrainingPipeline:
    def __init__(self, config_path="config/training_config.yaml"):
        self.config = self.load_config(config_path)
        self.client = MlflowClient()
        self.logger = logging.getLogger(__name__)
        
    def load_config(self, config_path):
        \"\"\"Load training configuration\"\"\"
        with open(config_path, 'r') as file:
            return yaml.safe_load(file)
    
    def validate_data(self, df):
        \"\"\"Validate input data quality\"\"\"
        validation_results = {
            'passed': True,
            'issues': []
        }
        
        # Check for missing values
        missing_percentage = df.isnull().sum() / len(df)
        high_missing_cols = missing_percentage[missing_percentage > 0.1].index.tolist()
        
        if high_missing_cols:
            validation_results['issues'].append(f"High missing values in columns: {high_missing_cols}")
        
        # Check data types
        expected_dtypes = self.config['data']['expected_dtypes']
        for col, expected_dtype in expected_dtypes.items():
            if col in df.columns and df[col].dtype != expected_dtype:
                validation_results['issues'].append(f"Column {col} has dtype {df[col].dtype}, expected {expected_dtype}")
        
        # Check target distribution
        target_col = self.config['data']['target_column']
        if target_col in df.columns:
            target_distribution = df[target_col].value_counts(normalize=True)
            min_class_ratio = target_distribution.min()
            
            if min_class_ratio < 0.01:  # Less than 1%
                validation_results['issues'].append(f"Severe class imbalance detected: {min_class_ratio:.3f}")
        
        if validation_results['issues']:
            validation_results['passed'] = False
        
        return validation_results
    
    def preprocess_data(self, df):
        \"\"\"Preprocess data for training\"\"\"
        
        # Handle missing values
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        categorical_columns = df.select_dtypes(include=['object']).columns
        
        # Fill numeric missing values with median
        for col in numeric_columns:
            if df[col].isnull().any():
                df[col].fillna(df[col].median(), inplace=True)
        
        # Fill categorical missing values with mode
        for col in categorical_columns:
            if df[col].isnull().any():
                df[col].fillna(df[col].mode()[0], inplace=True)
        
        # Encode categorical variables
        from sklearn.preprocessing import LabelEncoder
        label_encoders = {}
        
        for col in categorical_columns:
            if col != self.config['data']['target_column']:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                label_encoders[col] = le
        
        # Store encoders for inference
        joblib.dump(label_encoders, 'artifacts/label_encoders.pkl')
        
        return df, label_encoders
    
    def train_model(self, X_train, X_test, y_train, y_test):
        \"\"\"Train and evaluate model\"\"\"
        
        with mlflow.start_run(run_name=f"training_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
            
            # Log parameters
            model_params = self.config['model']['parameters']
            mlflow.log_params(model_params)
            
            # Train model
            model = RandomForestClassifier(**model_params)
            model.fit(X_train, y_train)
            
            # Make predictions
            y_pred_train = model.predict(X_train)
            y_pred_test = model.predict(X_test)
            
            # Calculate metrics
            train_metrics = self.calculate_metrics(y_train, y_pred_train, prefix="train_")
            test_metrics = self.calculate_metrics(y_test, y_pred_test, prefix="test_")
            
            # Log metrics
            mlflow.log_metrics({**train_metrics, **test_metrics})
            
            # Log model
            mlflow.sklearn.log_model(
                model, 
                "model",
                registered_model_name=self.config['model']['name']
            )
            
            # Log artifacts
            self.log_artifacts(model, X_train, y_train)
            
            # Model validation
            is_valid = self.validate_model_performance(test_metrics)
            mlflow.log_param("model_validation_passed", is_valid)
            
            if is_valid:
                self.promote_model_to_staging()
            
            return model, test_metrics, is_valid
    
    def calculate_metrics(self, y_true, y_pred, prefix=""):
        \"\"\"Calculate performance metrics\"\"\"
        
        metrics = {
            f"{prefix}accuracy": accuracy_score(y_true, y_pred),
            f"{prefix}precision": precision_score(y_true, y_pred, average='weighted'),
            f"{prefix}recall": recall_score(y_true, y_pred, average='weighted'),
            f"{prefix}f1": f1_score(y_true, y_pred, average='weighted')
        }
        
        return metrics
    
    def log_artifacts(self, model, X_train, y_train):
        \"\"\"Log training artifacts\"\"\"
        
        # Feature importance
        if hasattr(model, 'feature_importances_'):
            feature_importance = pd.DataFrame({
                'feature': X_train.columns,
                'importance': model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            feature_importance.to_csv('artifacts/feature_importance.csv', index=False)
            mlflow.log_artifact('artifacts/feature_importance.csv')
        
        # Training data statistics
        train_stats = X_train.describe()
        train_stats.to_csv('artifacts/training_data_stats.csv')
        mlflow.log_artifact('artifacts/training_data_stats.csv')
        
        # Model serialization
        joblib.dump(model, 'artifacts/model.pkl')
        mlflow.log_artifact('artifacts/model.pkl')
    
    def validate_model_performance(self, metrics):
        \"\"\"Validate model performance against thresholds\"\"\"
        
        thresholds = self.config['validation']['performance_thresholds']
        
        for metric, threshold in thresholds.items():
            if metrics.get(f"test_{metric}", 0) < threshold:
                self.logger.warning(f"Model failed validation: {metric} = {metrics.get(f'test_{metric}')} < {threshold}")
                return False
        
        return True
    
    def promote_model_to_staging(self):
        \"\"\"Promote model to staging environment\"\"\"
        
        model_name = self.config['model']['name']
        latest_version = self.client.get_latest_versions(model_name, stages=["None"])[0]
        
        self.client.transition_model_version_stage(
            name=model_name,
            version=latest_version.version,
            stage="Staging"
        )
        
        self.logger.info(f"Model {model_name} version {latest_version.version} promoted to Staging")
    
    def run_pipeline(self, data_path):
        \"\"\"Run the complete training pipeline\"\"\"
        
        self.logger.info("Starting automated training pipeline")
        
        # Load data
        df = pd.read_csv(data_path)
        
        # Validate data
        validation_results = self.validate_data(df)
        if not validation_results['passed']:
            raise ValueError(f"Data validation failed: {validation_results['issues']}")
        
        # Preprocess data
        df_processed, encoders = self.preprocess_data(df)
        
        # Split features and target
        target_col = self.config['data']['target_column']
        X = df_processed.drop(columns=[target_col])
        y = df_processed[target_col]
        
        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=self.config['data']['test_size'],
            random_state=self.config['data']['random_state'],
            stratify=y
        )
        
        # Train model
        model, metrics, is_valid = self.train_model(X_train, X_test, y_train, y_test)
        
        pipeline_result = {
            'model': model,
            'metrics': metrics,
            'validation_passed': is_valid,
            'encoders': encoders
        }
        
        self.logger.info("Training pipeline completed successfully")
        
        return pipeline_result

# Configuration file example (training_config.yaml)
training_config_example = \"\"\"
data:
  target_column: "target"
  test_size: 0.2
  random_state: 42
  expected_dtypes:
    feature1: "float64"
    feature2: "int64"
    target: "int64"

model:
  name: "fraud_detection_model"
  parameters:
    n_estimators: 100
    max_depth: 10
    min_samples_split: 5
    random_state: 42

validation:
  performance_thresholds:
    accuracy: 0.85
    precision: 0.80
    recall: 0.80
    f1: 0.80

mlflow:
  experiment_name: "fraud_detection_experiment"
  tracking_uri: "http://localhost:5000"
\"\"\"

# Usage
if __name__ == "__main__":
    # Create config directory and file
    os.makedirs('config', exist_ok=True)
    os.makedirs('artifacts', exist_ok=True)
    
    with open('config/training_config.yaml', 'w') as f:
        f.write(training_config_example)
    
    # Run pipeline
    pipeline = AutoMLTrainingPipeline()
    results = pipeline.run_pipeline('data/training_data.csv')
    
    print(f"Training completed. Validation passed: {results['validation_passed']}")`;
  }

  setupModelMonitoring(analysis) {
    return `# Comprehensive Model Monitoring System

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import mlflow
from prometheus_client import CollectorRegistry, Counter, Histogram, Gauge, push_to_gateway
import logging
import json
import sqlite3
from evidently.dashboard import Dashboard
from evidently.tabs import DataDriftTab, NumTargetDriftTab, CatTargetDriftTab
import smtplib
from email.mime.text import MIMEText

class ModelMonitoringSystem:
    def __init__(self, model_name, model_version, db_path="monitoring.db"):
        self.model_name = model_name
        self.model_version = model_version
        self.db_path = db_path
        self.logger = logging.getLogger(__name__)
        
        # Initialize Prometheus metrics
        self.registry = CollectorRegistry()
        self.setup_prometheus_metrics()
        
        # Initialize database
        self.setup_database()
        
        # Load reference data for drift detection
        self.reference_data = None
        
    def setup_prometheus_metrics(self):
        \"\"\"Setup Prometheus metrics for monitoring\"\"\"
        
        self.prediction_counter = Counter(
            'ml_predictions_total',
            'Total number of predictions made',
            ['model_name', 'model_version', 'endpoint'],
            registry=self.registry
        )
        
        self.prediction_latency = Histogram(
            'ml_prediction_duration_seconds',
            'Time spent on predictions',
            ['model_name', 'model_version'],
            registry=self.registry
        )
        
        self.model_accuracy = Gauge(
            'ml_model_accuracy',
            'Current model accuracy',
            ['model_name', 'model_version'],
            registry=self.registry
        )
        
        self.data_drift_score = Gauge(
            'ml_data_drift_score',
            'Data drift detection score',
            ['model_name', 'model_version'],
            registry=self.registry
        )
        
        self.prediction_distribution = Histogram(
            'ml_prediction_values',
            'Distribution of prediction values',
            ['model_name', 'model_version'],
            registry=self.registry
        )
    
    def setup_database(self):
        \"\"\"Setup SQLite database for storing monitoring data\"\"\"
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                model_name TEXT,
                model_version TEXT,
                input_data TEXT,
                prediction REAL,
                prediction_proba REAL,
                latency REAL,
                actual_value REAL
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS model_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                model_name TEXT,
                model_version TEXT,
                metric_name TEXT,
                metric_value REAL,
                data_period TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS data_drift (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                model_name TEXT,
                model_version TEXT,
                drift_detected BOOLEAN,
                drift_score REAL,
                drifted_features TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                alert_type TEXT,
                severity TEXT,
                message TEXT,
                resolved BOOLEAN DEFAULT FALSE
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def log_prediction(self, input_data, prediction, prediction_proba=None, 
                      latency=None, actual_value=None):
        \"\"\"Log individual prediction for monitoring\"\"\"
        
        timestamp = datetime.now()
        
        # Update Prometheus metrics
        self.prediction_counter.labels(
            model_name=self.model_name,
            model_version=self.model_version,
            endpoint='predict'
        ).inc()
        
        if latency:
            self.prediction_latency.labels(
                model_name=self.model_name,
                model_version=self.model_version
            ).observe(latency)
        
        self.prediction_distribution.labels(
            model_name=self.model_name,
            model_version=self.model_version
        ).observe(prediction)
        
        # Store in database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO predictions 
            (timestamp, model_name, model_version, input_data, prediction, 
             prediction_proba, latency, actual_value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            timestamp, self.model_name, self.model_version,
            json.dumps(input_data), prediction, prediction_proba,
            latency, actual_value
        ))
        
        conn.commit()
        conn.close()
        
        # Log to MLflow
        with mlflow.start_run():
            mlflow.log_metrics({
                'prediction_value': prediction,
                'prediction_latency': latency or 0,
                'timestamp': timestamp.timestamp()
            })
    
    def check_data_drift(self, current_data, threshold=0.1):
        \"\"\"Check for data drift using Evidently AI\"\"\"
        
        if self.reference_data is None:
            self.logger.warning("No reference data available for drift detection")
            return None
        
        # Create Evidently dashboard
        dashboard = Dashboard(tabs=[DataDriftTab()])
        dashboard.calculate(self.reference_data, current_data)
        
        # Extract drift results
        drift_report = dashboard.tabs[0].json()
        drift_detected = drift_report['data_drift']['data_drift']
        drift_score = drift_report['data_drift']['dataset_drift_score']
        drifted_features = drift_report['data_drift']['drifted_features']
        
        # Update Prometheus metric
        self.data_drift_score.labels(
            model_name=self.model_name,
            model_version=self.model_version
        ).set(drift_score)
        
        # Store drift information
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO data_drift 
            (timestamp, model_name, model_version, drift_detected, 
             drift_score, drifted_features)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now(), self.model_name, self.model_version,
            drift_detected, drift_score, json.dumps(drifted_features)
        ))
        
        conn.commit()
        conn.close()
        
        # Alert if drift detected
        if drift_detected:
            self.create_alert(
                alert_type="data_drift",
                severity="high",
                message=f"Data drift detected with score {drift_score:.3f}. Drifted features: {drifted_features}"
            )
        
        return {
            'drift_detected': drift_detected,
            'drift_score': drift_score,
            'drifted_features': drifted_features
        }
    
    def calculate_model_performance(self, period_hours=24):
        \"\"\"Calculate model performance over specified period\"\"\"
        
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=period_hours)
        
        # Get predictions with actual values
        conn = sqlite3.connect(self.db_path)
        
        query = '''
            SELECT prediction, actual_value, timestamp 
            FROM predictions 
            WHERE model_name = ? AND model_version = ? 
            AND timestamp BETWEEN ? AND ?
            AND actual_value IS NOT NULL
        '''
        
        df = pd.read_sql_query(
            query, conn, 
            params=(self.model_name, self.model_version, start_time, end_time)
        )
        
        conn.close()
        
        if len(df) == 0:
            self.logger.warning("No predictions with actual values found for performance calculation")
            return None
        
        # Calculate metrics
        from sklearn.metrics import accuracy_score, precision_score, recall_score, mean_squared_error
        
        # Convert to appropriate format based on problem type
        if df['actual_value'].dtype in ['int64', 'object']:
            # Classification metrics
            accuracy = accuracy_score(df['actual_value'], df['prediction'])
            precision = precision_score(df['actual_value'], df['prediction'], average='weighted')
            recall = recall_score(df['actual_value'], df['prediction'], average='weighted')
            
            metrics = {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall
            }
        else:
            # Regression metrics
            mse = mean_squared_error(df['actual_value'], df['prediction'])
            rmse = np.sqrt(mse)
            mae = np.mean(np.abs(df['actual_value'] - df['prediction']))
            
            metrics = {
                'mse': mse,
                'rmse': rmse,
                'mae': mae
            }
        
        # Update Prometheus metrics
        if 'accuracy' in metrics:
            self.model_accuracy.labels(
                model_name=self.model_name,
                model_version=self.model_version
            ).set(metrics['accuracy'])
        
        # Store performance metrics
        self.store_performance_metrics(metrics, f"{period_hours}h")
        
        # Check for performance degradation
        self.check_performance_degradation(metrics)
        
        return metrics
    
    def store_performance_metrics(self, metrics, period):
        \"\"\"Store performance metrics in database\"\"\"
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        timestamp = datetime.now()
        
        for metric_name, metric_value in metrics.items():
            cursor.execute('''
                INSERT INTO model_performance 
                (timestamp, model_name, model_version, metric_name, metric_value, data_period)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                timestamp, self.model_name, self.model_version,
                metric_name, metric_value, period
            ))
        
        conn.commit()
        conn.close()
    
    def check_performance_degradation(self, current_metrics):
        \"\"\"Check for performance degradation\"\"\"
        
        # Define thresholds (should be configurable)
        thresholds = {
            'accuracy': 0.85,
            'precision': 0.80,
            'recall': 0.80,
            'rmse': 0.1  # Example for regression
        }
        
        for metric, value in current_metrics.items():
            threshold = thresholds.get(metric)
            if threshold is None:
                continue
            
            if metric in ['accuracy', 'precision', 'recall'] and value < threshold:
                self.create_alert(
                    alert_type="performance_degradation",
                    severity="high",
                    message=f"Model {metric} dropped to {value:.3f}, below threshold {threshold}"
                )
            elif metric in ['mse', 'rmse', 'mae'] and value > threshold:
                self.create_alert(
                    alert_type="performance_degradation",
                    severity="high",
                    message=f"Model {metric} increased to {value:.3f}, above threshold {threshold}"
                )
    
    def create_alert(self, alert_type, severity, message):
        \"\"\"Create and store alert\"\"\"
        
        # Store in database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO alerts (timestamp, alert_type, severity, message)
            VALUES (?, ?, ?, ?)
        ''', (datetime.now(), alert_type, severity, message))
        
        conn.commit()
        conn.close()
        
        # Log alert
        self.logger.warning(f"ALERT [{severity.upper()}] {alert_type}: {message}")
        
        # Send notification (implement based on your notification system)
        self.send_notification(alert_type, severity, message)
    
    def send_notification(self, alert_type, severity, message):
        \"\"\"Send alert notification\"\"\"
        
        # Example: Send email notification
        if severity == "high":
            try:
                # Configure your email settings
                smtp_server = "smtp.gmail.com"
                smtp_port = 587
                email_user = "your-email@gmail.com"
                email_password = "your-password"
                
                msg = MIMEText(f"Alert Type: {alert_type}\\nSeverity: {severity}\\nMessage: {message}")
                msg['Subject'] = f"Model Monitoring Alert: {self.model_name}"
                msg['From'] = email_user
                msg['To'] = "team@company.com"
                
                with smtplib.SMTP(smtp_server, smtp_port) as server:
                    server.starttls()
                    server.login(email_user, email_password)
                    server.send_message(msg)
                    
            except Exception as e:
                self.logger.error(f"Failed to send email notification: {e}")
    
    def generate_monitoring_report(self, period_hours=24):
        \"\"\"Generate comprehensive monitoring report\"\"\"
        
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=period_hours)
        
        # Get summary statistics
        conn = sqlite3.connect(self.db_path)
        
        # Prediction count
        pred_count = pd.read_sql_query('''
            SELECT COUNT(*) as count FROM predictions 
            WHERE timestamp BETWEEN ? AND ?
        ''', conn, params=(start_time, end_time))['count'].iloc[0]
        
        # Recent alerts
        recent_alerts = pd.read_sql_query('''
            SELECT * FROM alerts 
            WHERE timestamp BETWEEN ? AND ?
            ORDER BY timestamp DESC
        ''', conn, params=(start_time, end_time))
        
        # Performance metrics
        recent_performance = pd.read_sql_query('''
            SELECT * FROM model_performance 
            WHERE timestamp BETWEEN ? AND ?
            ORDER BY timestamp DESC
        ''', conn, params=(start_time, end_time))
        
        conn.close()
        
        report = {
            'period': f"{period_hours} hours",
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'prediction_count': pred_count,
            'alerts_count': len(recent_alerts),
            'high_severity_alerts': len(recent_alerts[recent_alerts['severity'] == 'high']),
            'recent_performance': recent_performance.to_dict('records'),
            'recent_alerts': recent_alerts.to_dict('records')
        }
        
        return report

# Usage example
def setup_model_monitoring():
    # Initialize monitoring system
    monitor = ModelMonitoringSystem("fraud_detection_model", "1.0")
    
    # Load reference data for drift detection
    reference_data = pd.read_csv("data/reference_data.csv")
    monitor.reference_data = reference_data
    
    # Example: Log a prediction
    input_data = {"amount": 1000, "merchant": "online", "hour": 14}
    prediction = 0.8  # fraud probability
    latency = 0.05  # 50ms
    
    monitor.log_prediction(input_data, prediction, latency=latency)
    
    # Check data drift
    current_data = pd.read_csv("data/current_data.csv")
    drift_result = monitor.check_data_drift(current_data)
    
    # Calculate performance
    performance = monitor.calculate_model_performance(period_hours=24)
    
    # Generate report
    report = monitor.generate_monitoring_report(period_hours=24)
    
    return monitor, report

if __name__ == "__main__":
    monitor, report = setup_model_monitoring()
    print(f"Monitoring setup complete. Report: {json.dumps(report, indent=2)}")`;
  }

  implementGovernance(analysis) {
    return `# ML Model Governance Framework

import json
import sqlite3
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional
import mlflow
from mlflow.tracking import MlflowClient
import hashlib
import logging

@dataclass
class ModelMetadata:
    name: str
    version: str
    description: str
    algorithm: str
    training_date: datetime
    performance_metrics: Dict[str, float]
    data_sources: List[str]
    features: List[str]
    target_variable: str
    business_purpose: str
    risk_level: str  # low, medium, high
    compliance_requirements: List[str]
    approved_by: str
    deployment_date: Optional[datetime] = None
    retirement_date: Optional[datetime] = None

@dataclass
class DataLineage:
    source_id: str
    source_type: str  # database, file, api, etc.
    extraction_date: datetime
    transformations: List[str]
    quality_checks: Dict[str, bool]
    data_hash: str

class ModelGovernanceSystem:
    def __init__(self, db_path="governance.db"):
        self.db_path = db_path
        self.client = MlflowClient()
        self.logger = logging.getLogger(__name__)
        self.setup_database()
    
    def setup_database(self):
        \"\"\"Setup governance database\"\"\"
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Model registry table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS model_registry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                version TEXT NOT NULL,
                description TEXT,
                algorithm TEXT,
                training_date DATETIME,
                performance_metrics TEXT,
                data_sources TEXT,
                features TEXT,
                target_variable TEXT,
                business_purpose TEXT,
                risk_level TEXT,
                compliance_requirements TEXT,
                approved_by TEXT,
                deployment_date DATETIME,
                retirement_date DATETIME,
                status TEXT DEFAULT 'development',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, version)
            )
        ''')
        
        # Data lineage table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS data_lineage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_name TEXT,
                model_version TEXT,
                source_id TEXT,
                source_type TEXT,
                extraction_date DATETIME,
                transformations TEXT,
                quality_checks TEXT,
                data_hash TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Model approvals table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS model_approvals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_name TEXT,
                model_version TEXT,
                approver TEXT,
                approval_date DATETIME,
                approval_type TEXT,  -- development, staging, production
                comments TEXT,
                approved BOOLEAN
            )
        ''')
        
        # Compliance audits table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS compliance_audits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_name TEXT,
                model_version TEXT,
                audit_date DATETIME,
                audit_type TEXT,
                findings TEXT,
                compliance_status TEXT,
                auditor TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def register_model(self, metadata: ModelMetadata, lineage: List[DataLineage]):
        \"\"\"Register a new model with governance metadata\"\"\"
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Insert model metadata
            cursor.execute('''
                INSERT OR REPLACE INTO model_registry 
                (name, version, description, algorithm, training_date, 
                 performance_metrics, data_sources, features, target_variable,
                 business_purpose, risk_level, compliance_requirements, approved_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                metadata.name, metadata.version, metadata.description,
                metadata.algorithm, metadata.training_date,
                json.dumps(metadata.performance_metrics),
                json.dumps(metadata.data_sources),
                json.dumps(metadata.features),
                metadata.target_variable, metadata.business_purpose,
                metadata.risk_level, json.dumps(metadata.compliance_requirements),
                metadata.approved_by
            ))
            
            # Insert data lineage
            for lineage_item in lineage:
                cursor.execute('''
                    INSERT INTO data_lineage 
                    (model_name, model_version, source_id, source_type,
                     extraction_date, transformations, quality_checks, data_hash)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    metadata.name, metadata.version, lineage_item.source_id,
                    lineage_item.source_type, lineage_item.extraction_date,
                    json.dumps(lineage_item.transformations),
                    json.dumps(lineage_item.quality_checks),
                    lineage_item.data_hash
                ))
            
            conn.commit()
            self.logger.info(f"Model {metadata.name} v{metadata.version} registered successfully")
            
        except Exception as e:
            conn.rollback()
            self.logger.error(f"Failed to register model: {e}")
            raise
        finally:
            conn.close()
    
    def request_approval(self, model_name: str, model_version: str, 
                        approval_type: str, requester: str):
        \"\"\"Request model approval for deployment\"\"\"
        
        # Validate model exists
        model_info = self.get_model_info(model_name, model_version)
        if not model_info:
            raise ValueError(f"Model {model_name} v{model_version} not found")
        
        # Create approval request
        approval_request = {
            'model_name': model_name,
            'model_version': model_version,
            'approval_type': approval_type,
            'requester': requester,
            'request_date': datetime.now(),
            'status': 'pending'
        }
        
        # Log to MLflow
        with mlflow.start_run():
            mlflow.log_params(approval_request)
        
        self.logger.info(f"Approval requested for {model_name} v{model_version} - {approval_type}")
        
        return approval_request
    
    def approve_model(self, model_name: str, model_version: str,
                     approval_type: str, approver: str, comments: str = ""):
        \"\"\"Approve model for deployment\"\"\"
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Record approval
        cursor.execute('''
            INSERT INTO model_approvals 
            (model_name, model_version, approver, approval_date, 
             approval_type, comments, approved)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            model_name, model_version, approver, datetime.now(),
            approval_type, comments, True
        ))
        
        # Update model status
        status_map = {
            'development': 'development',
            'staging': 'staging',
            'production': 'production'
        }
        
        cursor.execute('''
            UPDATE model_registry 
            SET status = ?
            WHERE name = ? AND version = ?
        ''', (status_map[approval_type], model_name, model_version))
        
        conn.commit()
        conn.close()
        
        # Promote model in MLflow
        if approval_type == 'production':
            self.client.transition_model_version_stage(
                name=model_name,
                version=model_version,
                stage="Production"
            )
        
        self.logger.info(f"Model {model_name} v{model_version} approved for {approval_type}")
    
    def conduct_compliance_audit(self, model_name: str, model_version: str,
                                audit_type: str, auditor: str):
        \"\"\"Conduct compliance audit for model\"\"\"
        
        model_info = self.get_model_info(model_name, model_version)
        if not model_info:
            raise ValueError(f"Model {model_name} v{model_version} not found")
        
        # Perform automated checks
        audit_findings = self.automated_compliance_checks(model_info)
        
        # Determine compliance status
        compliance_status = "compliant" if all(audit_findings.values()) else "non-compliant"
        
        # Store audit results
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO compliance_audits 
            (model_name, model_version, audit_date, audit_type,
             findings, compliance_status, auditor)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            model_name, model_version, datetime.now(), audit_type,
            json.dumps(audit_findings), compliance_status, auditor
        ))
        
        conn.commit()
        conn.close()
        
        return {
            'compliance_status': compliance_status,
            'findings': audit_findings,
            'audit_date': datetime.now(),
            'auditor': auditor
        }
    
    def automated_compliance_checks(self, model_info: Dict) -> Dict[str, bool]:
        \"\"\"Perform automated compliance checks\"\"\"
        
        checks = {}
        
        # Check if model has required documentation
        checks['has_description'] = bool(model_info.get('description'))
        checks['has_business_purpose'] = bool(model_info.get('business_purpose'))
        checks['has_performance_metrics'] = bool(model_info.get('performance_metrics'))
        
        # Check data lineage
        checks['has_data_lineage'] = self.check_data_lineage_exists(
            model_info['name'], model_info['version']
        )
        
        # Check approval status
        checks['has_approval'] = self.check_approval_exists(
            model_info['name'], model_info['version']
        )
        
        # Risk assessment
        risk_level = model_info.get('risk_level', 'unknown')
        checks['risk_assessed'] = risk_level in ['low', 'medium', 'high']
        
        # Performance thresholds
        performance_metrics = json.loads(model_info.get('performance_metrics', '{}'))
        checks['meets_performance_threshold'] = self.check_performance_thresholds(performance_metrics)
        
        return checks
    
    def check_data_lineage_exists(self, model_name: str, model_version: str) -> bool:
        \"\"\"Check if data lineage exists for model\"\"\"
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT COUNT(*) FROM data_lineage 
            WHERE model_name = ? AND model_version = ?
        ''', (model_name, model_version))
        
        count = cursor.fetchone()[0]
        conn.close()
        
        return count > 0
    
    def check_approval_exists(self, model_name: str, model_version: str) -> bool:
        \"\"\"Check if model has been approved\"\"\"
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT COUNT(*) FROM model_approvals 
            WHERE model_name = ? AND model_version = ? AND approved = 1
        ''', (model_name, model_version))
        
        count = cursor.fetchone()[0]
        conn.close()
        
        return count > 0
    
    def check_performance_thresholds(self, metrics: Dict[str, float]) -> bool:
        \"\"\"Check if model meets performance thresholds\"\"\"
        
        # Define minimum thresholds (should be configurable)
        thresholds = {
            'accuracy': 0.80,
            'precision': 0.75,
            'recall': 0.75
        }
        
        for metric, threshold in thresholds.items():
            if metric in metrics and metrics[metric] < threshold:
                return False
        
        return True
    
    def get_model_info(self, model_name: str, model_version: str) -> Optional[Dict]:
        \"\"\"Get model information from registry\"\"\"
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM model_registry 
            WHERE name = ? AND version = ?
        ''', (model_name, model_version))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            columns = [description[0] for description in cursor.description]
            return dict(zip(columns, row))
        
        return None
    
    def generate_governance_report(self) -> Dict:
        \"\"\"Generate comprehensive governance report\"\"\"
        
        conn = sqlite3.connect(self.db_path)
        
        # Model registry summary
        registry_df = pd.read_sql_query('SELECT * FROM model_registry', conn)
        
        # Approval summary
        approvals_df = pd.read_sql_query('SELECT * FROM model_approvals', conn)
        
        # Compliance summary
        compliance_df = pd.read_sql_query('SELECT * FROM compliance_audits', conn)
        
        conn.close()
        
        report = {
            'total_models': len(registry_df),
            'models_by_status': registry_df['status'].value_counts().to_dict(),
            'models_by_risk_level': registry_df['risk_level'].value_counts().to_dict(),
            'pending_approvals': len(approvals_df[approvals_df['approved'] == 0]),
            'compliance_status': compliance_df['compliance_status'].value_counts().to_dict(),
            'recent_audits': compliance_df.head(10).to_dict('records')
        }
        
        return report

# Usage example
def setup_model_governance():
    governance = ModelGovernanceSystem()
    
    # Register a model
    metadata = ModelMetadata(
        name="fraud_detection_model",
        version="1.0",
        description="ML model for detecting fraudulent transactions",
        algorithm="Random Forest",
        training_date=datetime.now(),
        performance_metrics={"accuracy": 0.92, "precision": 0.88, "recall": 0.85},
        data_sources=["transactions_db", "customer_profiles"],
        features=["amount", "merchant_category", "time_of_day", "location"],
        target_variable="is_fraud",
        business_purpose="Reduce financial losses from fraud",
        risk_level="high",
        compliance_requirements=["PCI DSS", "GDPR"],
        approved_by="data_science_lead"
    )
    
    lineage = [
        DataLineage(
            source_id="transactions_db",
            source_type="database",
            extraction_date=datetime.now(),
            transformations=["normalize_amounts", "encode_categories"],
            quality_checks={"no_nulls": True, "valid_ranges": True},
            data_hash="abc123def456"
        )
    ]
    
    governance.register_model(metadata, lineage)
    
    # Request approval
    governance.request_approval("fraud_detection_model", "1.0", "production", "ml_engineer")
    
    # Conduct audit
    audit_result = governance.conduct_compliance_audit(
        "fraud_detection_model", "1.0", "pre_production", "compliance_officer"
    )
    
    return governance, audit_result

if __name__ == "__main__":
    governance, audit = setup_model_governance()
    print(f"Governance setup complete. Audit result: {audit}")`;
  }
}

module.exports = MLOpsSpecialist;