/**
 * BUMBA Data & Analytics Specialists Expertise
 * Enhanced knowledge for Data Engineer, Data Scientist, and Business Intelligence specialists
 * Sprint 14 Implementation
 */

class DataAnalyticsExpertise {
  /**
   * Data Engineer Expert Knowledge
   */
  static getDataEngineerExpertise() {
    return {
      name: 'Data Engineer Expert',
      expertise: {
        core: {
          pipeline: 'ETL/ELT pipelines, data workflows, batch and stream processing',
          storage: 'Data warehouses, data lakes, distributed storage systems',
          processing: 'Apache Spark, Kafka, Airflow, Hadoop ecosystem',
          cloud: 'AWS, GCP, Azure data services, serverless architectures',
          modeling: 'Data modeling, schema design, data governance'
        },
        
        technologies: {
          big_data: 'Apache Spark, Hadoop, Kafka, Flink, Storm',
          databases: 'PostgreSQL, MongoDB, Cassandra, Redis, Elasticsearch',
          cloud_platforms: 'AWS (S3, Redshift, Glue), GCP (BigQuery, Dataflow), Azure (Synapse)',
          orchestration: 'Apache Airflow, Prefect, Luigi, Dagster',
          streaming: 'Apache Kafka, Kinesis, Pulsar, event-driven architectures'
        },
        
        programming: {
          languages: 'Python, Scala, Java, SQL, R',
          frameworks: 'PySpark, Pandas, Dask, Apache Beam',
          tools: 'Docker, Kubernetes, Terraform, Git, CI/CD',
          monitoring: 'Prometheus, Grafana, ELK stack, DataDog'
        },
        
        architecture: {
          patterns: 'Lambda architecture, Kappa architecture, medallion architecture',
          storage: 'Data lake, data warehouse, lakehouse, data mesh',
          processing: 'Batch processing, stream processing, real-time analytics',
          integration: 'API integration, CDC, event sourcing, message queues'
        },
        
        governance: {
          quality: 'Data quality, validation, profiling, monitoring',
          security: 'Data encryption, access control, compliance, privacy',
          lineage: 'Data lineage, cataloging, metadata management',
          compliance: 'GDPR, CCPA, SOX, industry regulations'
        }
      },
      
      capabilities: [
        'Data pipeline design and implementation',
        'ETL/ELT process development',
        'Big data processing with Spark and Hadoop',
        'Real-time streaming data processing',
        'Cloud data platform architecture',
        'Data warehouse and data lake design',
        'Data quality and governance implementation',
        'Performance optimization and tuning',
        'Data integration and API development',
        'Monitoring and alerting setup',
        'Data security and compliance',
        'Infrastructure as Code for data platforms',
        'Data modeling and schema design',
        'Workflow orchestration and scheduling',
        'Data migration and transformation',
        'Disaster recovery and backup strategies'
      ],
      
      systemPromptAdditions: `
You are a Data Engineer expert specializing in:
- Large-scale data pipeline design and implementation
- Big data technologies and distributed processing
- Cloud data platforms and modern data architectures
- Data quality, governance, and security practices
- Real-time streaming and batch processing systems
- Infrastructure automation and DevOps for data
- Performance optimization and scalability

Always focus on scalable, reliable, and maintainable data solutions with proper monitoring and governance.`,

      bestPractices: [
        'Design idempotent and fault-tolerant data pipelines',
        'Implement comprehensive data quality checks',
        'Use infrastructure as code for reproducibility',
        'Monitor data pipeline performance and health',
        'Implement proper error handling and retry logic',
        'Maintain data lineage and documentation',
        'Use appropriate partitioning and indexing strategies',
        'Implement data security and access controls',
        'Design for scalability and performance',
        'Use version control for all data pipeline code',
        'Implement automated testing for data pipelines',
        'Follow data governance and compliance requirements',
        'Use appropriate data storage formats and compression',
        'Implement proper logging and alerting',
        'Design modular and reusable components'
      ],
      
      codePatterns: {
        sparkETL: `
# PySpark ETL Pipeline
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *

class ETLPipeline:
    def __init__(self, app_name="ETL_Pipeline"):
        self.spark = SparkSession.builder \\
            .appName(app_name) \\
            .config("spark.sql.adaptive.enabled", "true") \\
            .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \\
            .getOrCreate()
    
    def extract_data(self, source_path, format_type="parquet"):
        """Extract data from various sources"""
        try:
            if format_type == "parquet":
                df = self.spark.read.parquet(source_path)
            elif format_type == "json":
                df = self.spark.read.json(source_path)
            elif format_type == "csv":
                df = self.spark.read.option("header", "true").csv(source_path)
            else:
                raise ValueError(f"Unsupported format: {format_type}")
            
            return df
        except Exception as e:
            print(f"Error extracting data: {e}")
            raise
    
    def transform_data(self, df):
        """Apply transformations to the data"""
        # Data cleaning and transformation
        transformed_df = df \\
            .filter(col("status") == "active") \\
            .withColumn("processed_date", current_date()) \\
            .withColumn("full_name", concat(col("first_name"), lit(" "), col("last_name"))) \\
            .withColumn("age_group", 
                       when(col("age") < 18, "Minor")
                       .when(col("age") < 65, "Adult")
                       .otherwise("Senior")) \\
            .dropDuplicates(["user_id"]) \\
            .na.drop()
        
        return transformed_df
    
    def load_data(self, df, target_path, format_type="parquet", mode="overwrite"):
        """Load data to target destination"""
        try:
            if format_type == "parquet":
                df.write.mode(mode).parquet(target_path)
            elif format_type == "delta":
                df.write.format("delta").mode(mode).save(target_path)
            elif format_type == "jdbc":
                df.write.format("jdbc") \\
                    .option("url", target_path) \\
                    .option("dbtable", "users") \\
                    .mode(mode) \\
                    .save()
            
            print(f"Data successfully loaded to {target_path}")
        except Exception as e:
            print(f"Error loading data: {e}")
            raise
    
    def run_pipeline(self, source_path, target_path):
        """Execute the complete ETL pipeline"""
        # Extract
        raw_df = self.extract_data(source_path)
        
        # Transform
        processed_df = self.transform_data(raw_df)
        
        # Load
        self.load_data(processed_df, target_path)
        
        # Cleanup
        self.spark.stop()`,

        airflowDAG: `
# Apache Airflow DAG
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.operators.bash_operator import BashOperator
from airflow.sensors.s3_key_sensor import S3KeySensor
from airflow.hooks.postgres_hook import PostgresHook

default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(hours=2)
}

dag = DAG(
    'daily_user_analytics',
    default_args=default_args,
    description='Daily user analytics processing',
    schedule_interval='0 6 * * *',  # Daily at 6 AM
    max_active_runs=1,
    catchup=False,
    tags=['analytics', 'daily']
)

def extract_user_data(**context):
    """Extract user data from source systems"""
    execution_date = context['execution_date']
    date_str = execution_date.strftime('%Y-%m-%d')
    
    # Extract logic here
    print(f"Extracting user data for {date_str}")
    return f"s3://data-lake/raw/users/date={date_str}/"

def transform_user_data(**context):
    """Transform user data using Spark"""
    input_path = context['task_instance'].xcom_pull(task_ids='extract_user_data')
    
    # Spark transformation logic
    print(f"Transforming data from {input_path}")
    return f"s3://data-lake/processed/users/date={context['ds']}/"

def load_to_warehouse(**context):
    """Load processed data to data warehouse"""
    processed_path = context['task_instance'].xcom_pull(task_ids='transform_user_data')
    
    pg_hook = PostgresHook(postgres_conn_id='data_warehouse')
    
    # Load logic here
    sql = f"""
    COPY users_daily 
    FROM '{processed_path}' 
    WITH (FORMAT PARQUET, COMPRESSION GZIP);
    """
    
    pg_hook.run(sql)
    print("Data loaded to warehouse successfully")

# Define tasks
wait_for_source_data = S3KeySensor(
    task_id='wait_for_source_data',
    bucket_name='source-data-bucket',
    bucket_key='users/{{ ds }}/data_ready.flag',
    timeout=3600,
    poke_interval=300,
    dag=dag
)

extract_task = PythonOperator(
    task_id='extract_user_data',
    python_callable=extract_user_data,
    dag=dag
)

transform_task = PythonOperator(
    task_id='transform_user_data',
    python_callable=transform_user_data,
    dag=dag
)

load_task = PythonOperator(
    task_id='load_to_warehouse',
    python_callable=load_to_warehouse,
    dag=dag
)

data_quality_check = BashOperator(
    task_id='data_quality_check',
    bash_command='python /scripts/data_quality_check.py --date {{ ds }}',
    dag=dag
)

# Define dependencies
wait_for_source_data >> extract_task >> transform_task >> load_task >> data_quality_check`,

        kafkaStreaming: `
# Kafka Streaming with Python
from kafka import KafkaConsumer, KafkaProducer
import json
import logging
from datetime import datetime
import pandas as pd

class RealTimeDataProcessor:
    def __init__(self, bootstrap_servers, input_topic, output_topic):
        self.bootstrap_servers = bootstrap_servers
        self.input_topic = input_topic
        self.output_topic = output_topic
        
        # Initialize consumer
        self.consumer = KafkaConsumer(
            input_topic,
            bootstrap_servers=bootstrap_servers,
            value_deserializer=lambda x: json.loads(x.decode('utf-8')),
            group_id='data_processor_group',
            enable_auto_commit=True,
            auto_offset_reset='latest'
        )
        
        # Initialize producer
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda x: json.dumps(x).encode('utf-8')
        )
        
        self.logger = logging.getLogger(__name__)
    
    def process_message(self, message):
        """Process individual message"""
        try:
            # Extract data
            user_id = message.get('user_id')
            event_type = message.get('event_type')
            timestamp = message.get('timestamp')
            properties = message.get('properties', {})
            
            # Transform data
            processed_data = {
                'user_id': user_id,
                'event_type': event_type,
                'timestamp': timestamp,
                'processed_at': datetime.utcnow().isoformat(),
                'session_id': properties.get('session_id'),
                'page_views': properties.get('page_views', 0),
                'duration': properties.get('duration', 0),
                'revenue': self.calculate_revenue(event_type, properties),
                'user_segment': self.classify_user_segment(properties)
            }
            
            return processed_data
            
        except Exception as e:
            self.logger.error(f"Error processing message: {e}")
            return None
    
    def calculate_revenue(self, event_type, properties):
        """Calculate revenue based on event type"""
        if event_type == 'purchase':
            return properties.get('amount', 0)
        elif event_type == 'subscription':
            return properties.get('subscription_fee', 0)
        return 0
    
    def classify_user_segment(self, properties):
        """Classify user into segments"""
        total_spent = properties.get('total_spent', 0)
        days_active = properties.get('days_active', 0)
        
        if total_spent > 1000 and days_active > 90:
            return 'premium'
        elif total_spent > 100 and days_active > 30:
            return 'regular'
        else:
            return 'basic'
    
    def run(self):
        """Main processing loop"""
        self.logger.info("Starting real-time data processor")
        
        try:
            for message in self.consumer:
                # Process message
                processed_data = self.process_message(message.value)
                
                if processed_data:
                    # Send to output topic
                    self.producer.send(self.output_topic, processed_data)
                    self.logger.debug(f"Processed message for user {processed_data['user_id']}")
                
        except KeyboardInterrupt:
            self.logger.info("Stopping processor")
        except Exception as e:
            self.logger.error(f"Error in main loop: {e}")
        finally:
            self.consumer.close()
            self.producer.close()

# Usage
if __name__ == "__main__":
    processor = RealTimeDataProcessor(
        bootstrap_servers=['localhost:9092'],
        input_topic='user_events',
        output_topic='processed_events'
    )
    processor.run()`
      }
    };
  }
  
  /**
   * Data Scientist Expert Knowledge
   */
  static getDataScientistExpertise() {
    return {
      name: 'Data Scientist Expert',
      expertise: {
        core: {
          statistics: 'Descriptive and inferential statistics, hypothesis testing, A/B testing',
          ml_algorithms: 'Supervised, unsupervised, reinforcement learning, deep learning',
          analysis: 'Exploratory data analysis, feature engineering, model selection',
          programming: 'Python, R, SQL, statistical computing',
          visualization: 'Data visualization, storytelling, dashboard creation'
        },
        
        machine_learning: {
          supervised: 'Linear/logistic regression, decision trees, random forest, SVM, XGBoost',
          unsupervised: 'Clustering, PCA, association rules, anomaly detection',
          deep_learning: 'Neural networks, CNN, RNN, LSTM, transformers',
          nlp: 'Text preprocessing, sentiment analysis, topic modeling, named entity recognition',
          computer_vision: 'Image processing, object detection, classification, segmentation'
        },
        
        tools: {
          python: 'Pandas, NumPy, Scikit-learn, TensorFlow, PyTorch, Matplotlib, Seaborn',
          r: 'dplyr, ggplot2, caret, randomForest, shiny',
          big_data: 'Spark MLlib, Dask, Rapids, distributed computing',
          cloud: 'AWS SageMaker, Google AI Platform, Azure ML',
          mlops: 'MLflow, Kubeflow, DVC, Weights & Biases'
        },
        
        methodology: {
          crisp_dm: 'Cross-Industry Standard Process for Data Mining',
          experimentation: 'A/B testing, multivariate testing, causal inference',
          validation: 'Cross-validation, train/test/validation splits, model evaluation',
          deployment: 'Model deployment, monitoring, A/B testing in production'
        },
        
        business: {
          analytics: 'Customer analytics, churn prediction, recommendation systems',
          optimization: 'Price optimization, inventory optimization, resource allocation',
          forecasting: 'Time series analysis, demand forecasting, financial modeling',
          insights: 'Business intelligence, KPI analysis, actionable insights'
        }
      },
      
      capabilities: [
        'Exploratory data analysis and insights generation',
        'Statistical modeling and hypothesis testing',
        'Machine learning model development and evaluation',
        'Deep learning and neural network implementation',
        'Natural language processing and text analysis',
        'Computer vision and image analysis',
        'Time series forecasting and analysis',
        'A/B testing and experimental design',
        'Feature engineering and selection',
        'Model deployment and monitoring',
        'Data visualization and storytelling',
        'Business intelligence and KPI analysis',
        'Customer analytics and segmentation',
        'Recommendation system development',
        'Anomaly detection and fraud analysis',
        'MLOps and model lifecycle management'
      ],
      
      systemPromptAdditions: `
You are a Data Scientist expert specializing in:
- Statistical analysis and machine learning model development
- Advanced analytics and predictive modeling
- Deep learning and artificial intelligence techniques
- Business intelligence and data-driven insights
- Experimental design and A/B testing
- MLOps and model deployment practices
- Data visualization and communication

Always focus on business impact, statistical rigor, and actionable insights from data analysis.`,

      bestPractices: [
        'Start with clear business questions and objectives',
        'Perform thorough exploratory data analysis',
        'Validate assumptions with statistical tests',
        'Use appropriate evaluation metrics for the problem',
        'Implement proper cross-validation strategies',
        'Document methodology and reproducible code',
        'Communicate insights clearly to stakeholders',
        'Consider ethical implications and bias in models',
        'Monitor model performance in production',
        'Use version control for code and experiments',
        'Implement proper feature engineering techniques',
        'Test multiple algorithms and approaches',
        'Validate business impact of model predictions',
        'Maintain data quality and integrity',
        'Collaborate effectively with domain experts'
      ],
      
      codePatterns: {
        mlPipeline: `
# Machine Learning Pipeline with Scikit-learn
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import matplotlib.pyplot as plt
import seaborn as sns

class MLPipeline:
    def __init__(self, target_column):
        self.target_column = target_column
        self.models = {}
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.best_model = None
        
    def load_and_explore_data(self, file_path):
        """Load data and perform initial exploration"""
        self.df = pd.read_csv(file_path)
        
        print("Dataset Info:")
        print(f"Shape: {self.df.shape}")
        print(f"\\nMissing Values:\\n{self.df.isnull().sum()}")
        print(f"\\nTarget Distribution:\\n{self.df[self.target_column].value_counts()}")
        
        # Visualization
        plt.figure(figsize=(12, 8))
        
        # Target distribution
        plt.subplot(2, 2, 1)
        self.df[self.target_column].value_counts().plot(kind='bar')
        plt.title('Target Distribution')
        
        # Correlation heatmap
        plt.subplot(2, 2, 2)
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        sns.heatmap(self.df[numeric_cols].corr(), annot=True, cmap='coolwarm')
        plt.title('Feature Correlation')
        
        plt.tight_layout()
        plt.show()
        
        return self.df
    
    def preprocess_data(self):
        """Preprocess the data for modeling"""
        # Handle missing values
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        self.df[numeric_cols] = self.df[numeric_cols].fillna(self.df[numeric_cols].median())
        
        categorical_cols = self.df.select_dtypes(include=['object']).columns
        categorical_cols = categorical_cols.drop(self.target_column) if self.target_column in categorical_cols else categorical_cols
        
        for col in categorical_cols:
            self.df[col] = self.df[col].fillna(self.df[col].mode()[0])
        
        # Encode categorical variables
        for col in categorical_cols:
            le = LabelEncoder()
            self.df[col] = le.fit_transform(self.df[col])
        
        # Prepare features and target
        X = self.df.drop(columns=[self.target_column])
        y = self.df[self.target_column]
        
        # Encode target if categorical
        if y.dtype == 'object':
            y = self.label_encoder.fit_transform(y)
        
        # Split data
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        self.X_train_scaled = self.scaler.fit_transform(self.X_train)
        self.X_test_scaled = self.scaler.transform(self.X_test)
        
        print(f"Training set shape: {self.X_train.shape}")
        print(f"Test set shape: {self.X_test.shape}")
    
    def train_models(self):
        """Train multiple models and compare performance"""
        # Define models
        models = {
            'Logistic Regression': LogisticRegression(random_state=42),
            'Random Forest': RandomForestClassifier(random_state=42),
            'Gradient Boosting': GradientBoostingClassifier(random_state=42)
        }
        
        results = {}
        
        for name, model in models.items():
            print(f"\\nTraining {name}...")
            
            # Use scaled data for Logistic Regression
            if name == 'Logistic Regression':
                X_train_use = self.X_train_scaled
                X_test_use = self.X_test_scaled
            else:
                X_train_use = self.X_train
                X_test_use = self.X_test
            
            # Train model
            model.fit(X_train_use, self.y_train)
            
            # Predict
            y_pred = model.predict(X_test_use)
            y_pred_proba = model.predict_proba(X_test_use)[:, 1] if hasattr(model, 'predict_proba') else None
            
            # Evaluate
            cv_scores = cross_val_score(model, X_train_use, self.y_train, cv=5, scoring='roc_auc')
            auc_score = roc_auc_score(self.y_test, y_pred_proba) if y_pred_proba is not None else None
            
            results[name] = {
                'model': model,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std(),
                'auc_score': auc_score,
                'classification_report': classification_report(self.y_test, y_pred)
            }
            
            print(f"CV Score: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
            if auc_score:
                print(f"Test AUC: {auc_score:.4f}")
        
        self.models = results
        
        # Select best model
        best_model_name = max(results.keys(), key=lambda k: results[k]['cv_mean'])
        self.best_model = results[best_model_name]['model']
        
        print(f"\\nBest Model: {best_model_name}")
        return results
    
    def hyperparameter_tuning(self, model_name='Random Forest'):
        """Perform hyperparameter tuning for the selected model"""
        if model_name == 'Random Forest':
            model = RandomForestClassifier(random_state=42)
            param_grid = {
                'n_estimators': [100, 200, 300],
                'max_depth': [10, 20, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            }
        
        grid_search = GridSearchCV(
            model, param_grid, cv=5, scoring='roc_auc', n_jobs=-1
        )
        
        grid_search.fit(self.X_train, self.y_train)
        
        print(f"Best parameters: {grid_search.best_params_}")
        print(f"Best CV score: {grid_search.best_score_:.4f}")
        
        self.best_model = grid_search.best_estimator_
        return grid_search.best_estimator_`
      }
    };
  }
  
  /**
   * Business Intelligence Expert Knowledge
   */
  static getBusinessIntelligenceExpertise() {
    return {
      name: 'Business Intelligence Expert',
      expertise: {
        core: {
          reporting: 'Dashboard design, KPI development, executive reporting',
          analysis: 'Business analysis, trend analysis, performance measurement',
          visualization: 'Data visualization principles, chart selection, storytelling',
          tools: 'Tableau, Power BI, Looker, QlikView, Excel',
          data_modeling: 'Dimensional modeling, star schema, data warehouse design'
        },
        
        platforms: {
          tableau: 'Tableau Desktop, Server, Online, calculated fields, parameters',
          power_bi: 'Power BI Desktop, Service, DAX, Power Query, data modeling',
          looker: 'LookML, explores, dashboards, data modeling',
          excel: 'Advanced Excel, pivot tables, Power Query, Power Pivot',
          sql: 'SQL querying, stored procedures, database optimization'
        },
        
        methodology: {
          design: 'Dashboard design principles, user experience, accessibility',
          governance: 'Data governance, security, access control, compliance',
          performance: 'Query optimization, data refresh, caching strategies',
          collaboration: 'Stakeholder management, requirements gathering, training'
        },
        
        business: {
          kpis: 'Key Performance Indicators, metrics definition, benchmarking',
          analytics: 'Sales analytics, marketing analytics, operational analytics',
          forecasting: 'Business forecasting, trend analysis, scenario planning',
          strategy: 'Strategic planning, competitive analysis, market intelligence'
        },
        
        technical: {
          databases: 'SQL Server, Oracle, MySQL, PostgreSQL, cloud databases',
          integration: 'API integration, data connectors, real-time data',
          automation: 'Automated reporting, alert systems, scheduled refreshes',
          security: 'Row-level security, data privacy, compliance reporting'
        }
      },
      
      capabilities: [
        'Business intelligence strategy development',
        'Dashboard and report design',
        'KPI definition and measurement',
        'Data visualization and storytelling',
        'Self-service analytics implementation',
        'Data warehouse and mart design',
        'ETL process development for BI',
        'Performance monitoring and optimization',
        'User training and adoption',
        'Data governance and security',
        'Executive and operational reporting',
        'Ad-hoc analysis and insights',
        'Business requirements gathering',
        'BI tool administration and maintenance',
        'Data quality and validation',
        'Competitive intelligence and benchmarking'
      ],
      
      systemPromptAdditions: `
You are a Business Intelligence expert specializing in:
- Strategic business intelligence and analytics solutions
- Dashboard design and data visualization best practices
- KPI development and performance measurement
- Self-service analytics and data democratization
- BI platform administration and optimization
- Business requirements analysis and stakeholder management
- Data governance and security in BI environments

Always focus on business value, user adoption, and actionable insights that drive decision-making.`,

      bestPractices: [
        'Align BI initiatives with business strategy and goals',
        'Design dashboards with the end user in mind',
        'Use appropriate visualization types for different data',
        'Implement proper data governance and security',
        'Ensure data quality and accuracy in reports',
        'Create self-service analytics capabilities',
        'Provide training and support for end users',
        'Monitor dashboard performance and usage',
        'Establish clear KPIs and success metrics',
        'Use consistent design and branding across reports',
        'Implement version control for BI assets',
        'Create documentation for data sources and calculations',
        'Test reports thoroughly before deployment',
        'Gather feedback and iterate on BI solutions',
        'Plan for scalability and growth'
      ],
      
      codePatterns: {
        powerBIModel: `
// Power BI DAX Measures and Calculations

// Sales Metrics
Total Sales = SUM(Sales[Amount])

Sales YTD = TOTALYTD([Total Sales], Calendar[Date])

Sales Previous Year = 
CALCULATE(
    [Total Sales],
    SAMEPERIODLASTYEAR(Calendar[Date])
)

Sales Growth % = 
DIVIDE(
    [Total Sales] - [Sales Previous Year],
    [Sales Previous Year],
    0
)

// Customer Metrics
Total Customers = DISTINCTCOUNT(Sales[CustomerID])

New Customers = 
CALCULATE(
    [Total Customers],
    FILTER(
        Customer,
        Customer[First Purchase Date] >= 
        STARTOFMONTH(MAX(Calendar[Date]))
    )
)

Customer Lifetime Value = 
DIVIDE(
    [Total Sales],
    [Total Customers],
    0
)

// Advanced Analytics
Sales Trend = 
VAR CurrentMonth = [Total Sales]
VAR PreviousMonth = 
    CALCULATE(
        [Total Sales],
        DATEADD(Calendar[Date], -1, MONTH)
    )
VAR Trend = CurrentMonth - PreviousMonth
RETURN
    SWITCH(
        TRUE(),
        Trend > 0, "↗ Increasing",
        Trend < 0, "↘ Decreasing",
        "→ Stable"
    )

Top Product Category = 
CALCULATE(
    FIRSTNONBLANK(
        TOPN(
            1,
            SUMMARIZE(
                Sales,
                Product[Category],
                "Sales", [Total Sales]
            ),
            [Sales], DESC
        ),
        Product[Category]
    )
)`,

        tableauCalculations: `
// Tableau Calculated Fields

// Date Calculations
Days Since Last Order = 
DATEDIFF('day', 
    {FIXED [Customer ID]: MAX([Order Date])}, 
    TODAY()
)

// Running Totals
Running Sum of Sales = 
RUNNING_SUM(SUM([Sales]))

// Rank Calculations
Sales Rank = 
RANK(SUM([Sales]), 'desc')

Product Sales Rank by Category = 
RANK(SUM([Sales]), 'desc') 
PARTITION BY [Category]

// Cohort Analysis
Customer Cohort Month = 
DATETRUNC('month', 
    {FIXED [Customer ID]: MIN([Order Date])}
)

Cohort Size = 
{FIXED [Customer Cohort Month]: 
    COUNTD([Customer ID])
}

Retention Rate = 
COUNTD([Customer ID]) / [Cohort Size]

// Advanced Analytics
Forecast = 
IF ATTR([Date]) <= TODAY() 
THEN SUM([Sales])
ELSE 
    WINDOW_AVG(SUM([Sales]), 
        -11, 0) * 
    (1 + ([Seasonality Factor] - 1))
END

// Performance Indicators
Traffic Light KPI = 
IF [Sales Growth %] >= 0.1 THEN "🟢"
ELSEIF [Sales Growth %] >= 0 THEN "🟡"
ELSE "🔴"
END`,

        sqlBI: `
-- SQL for Business Intelligence

-- Sales Performance Dashboard Query
WITH monthly_sales AS (
    SELECT 
        DATE_TRUNC('month', order_date) as month,
        product_category,
        SUM(order_amount) as total_sales,
        COUNT(DISTINCT customer_id) as unique_customers,
        COUNT(*) as order_count,
        AVG(order_amount) as avg_order_value
    FROM orders o
    JOIN products p ON o.product_id = p.product_id
    WHERE order_date >= CURRENT_DATE - INTERVAL '24 months'
    GROUP BY 1, 2
),
sales_with_growth AS (
    SELECT *,
        LAG(total_sales, 1) OVER (
            PARTITION BY product_category 
            ORDER BY month
        ) as prev_month_sales,
        LAG(total_sales, 12) OVER (
            PARTITION BY product_category 
            ORDER BY month
        ) as prev_year_sales
    FROM monthly_sales
)
SELECT 
    month,
    product_category,
    total_sales,
    unique_customers,
    order_count,
    avg_order_value,
    CASE 
        WHEN prev_month_sales IS NOT NULL THEN
            ROUND(((total_sales - prev_month_sales) / prev_month_sales * 100), 2)
        ELSE NULL
    END as mom_growth_pct,
    CASE 
        WHEN prev_year_sales IS NOT NULL THEN
            ROUND(((total_sales - prev_year_sales) / prev_year_sales * 100), 2)
        ELSE NULL
    END as yoy_growth_pct,
    RANK() OVER (PARTITION BY month ORDER BY total_sales DESC) as category_rank
FROM sales_with_growth
ORDER BY month DESC, total_sales DESC;

-- Customer Segmentation Query
WITH customer_metrics AS (
    SELECT 
        customer_id,
        MIN(order_date) as first_order_date,
        MAX(order_date) as last_order_date,
        COUNT(*) as total_orders,
        SUM(order_amount) as total_spent,
        AVG(order_amount) as avg_order_value,
        CURRENT_DATE - MAX(order_date) as days_since_last_order
    FROM orders
    GROUP BY customer_id
),
customer_segments AS (
    SELECT *,
        CASE 
            WHEN total_spent >= 5000 AND total_orders >= 10 AND days_since_last_order <= 90 
                THEN 'VIP'
            WHEN total_spent >= 1000 AND total_orders >= 5 AND days_since_last_order <= 180 
                THEN 'Loyal'
            WHEN days_since_last_order <= 365 
                THEN 'Active'
            WHEN days_since_last_order > 365 
                THEN 'Dormant'
            ELSE 'New'
        END as customer_segment
    FROM customer_metrics
)
SELECT 
    customer_segment,
    COUNT(*) as customer_count,
    ROUND(AVG(total_spent), 2) as avg_total_spent,
    ROUND(AVG(total_orders), 2) as avg_total_orders,
    ROUND(AVG(avg_order_value), 2) as avg_order_value,
    ROUND(AVG(days_since_last_order), 0) as avg_days_since_last_order
FROM customer_segments
GROUP BY customer_segment
ORDER BY avg_total_spent DESC;`
      }
    };
  }
}

module.exports = DataAnalyticsExpertise;