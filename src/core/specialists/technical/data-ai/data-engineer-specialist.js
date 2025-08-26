/**
 * BUMBA Data Engineer Specialist
 * Expert in data pipelines, ETL processes, and data infrastructure
 */

const UnifiedSpecialistBase = require('../../unified-specialist-base');

class DataEngineerSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'Data Engineer Specialist',
      expertise: ['Data Pipelines', 'ETL/ELT', 'Data Warehousing', 'Stream Processing'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are a data engineering expert specializing in:
        - Building scalable data pipelines and ETL processes
        - Data warehousing and lake house architectures
        - Stream processing with Kafka, Spark Streaming
        - Workflow orchestration with Airflow, Prefect
        - Data quality monitoring and validation
        - Big data technologies (Spark, Hadoop, Flink)
        - Cloud data platforms (AWS, GCP, Azure)
        - Data modeling and optimization
        Always prioritize data quality, scalability, and performance.`
    });

    this.capabilities = {
      pipelines: true,
      etl: true,
      streaming: true,
      orchestration: true,
      warehousing: true,
      quality: true,
      optimization: true,
      monitoring: true
    };
  }

  async designDataPipeline(context) {
    const analysis = await this.analyze(context);
    
    return {
      architecture: this.designArchitecture(analysis),
      pipeline: this.createPipeline(analysis),
      orchestration: this.setupOrchestration(analysis),
      monitoring: this.implementMonitoring(analysis)
    };
  }

  designArchitecture(analysis) {
    return {
      batchProcessing: this.designBatchArchitecture(analysis),
      streamProcessing: this.designStreamArchitecture(analysis),
      lakehouse: this.designLakehouseArchitecture(analysis),
      dataWarehouse: this.designDataWarehouse(analysis)
    };
  }

  designBatchArchitecture(analysis) {
    return `# Batch Processing Architecture

## Components
1. **Data Sources**: Databases, APIs, Files, External Services
2. **Ingestion Layer**: Apache Sqoop, Talend, Custom Scripts
3. **Raw Data Storage**: Data Lake (S3, HDFS, Azure Data Lake)
4. **Processing Engine**: Apache Spark, Apache Beam
5. **Processed Data Storage**: Data Warehouse, Data Marts
6. **Orchestration**: Apache Airflow, Prefect, Luigi
7. **Monitoring**: Apache Atlas, DataDog, Custom Dashboards

## Data Flow
\`\`\`
[Data Sources] → [Ingestion] → [Raw Storage] → [Processing] → [Warehouse] → [Analytics]
\`\`\`

## Technologies Stack
- **Orchestration**: Apache Airflow
- **Processing**: Apache Spark (PySpark)
- **Storage**: AWS S3 + Apache Parquet
- **Warehouse**: Snowflake/BigQuery/Redshift
- **Monitoring**: Great Expectations + DataDog`;
  }

  createPipeline(analysis) {
    return {
      spark: this.createSparkPipeline(analysis),
      airflow: this.createAirflowDAG(analysis),
      dbt: this.createDBTProject(analysis)
    };
  }

  createSparkPipeline(analysis) {
    return `# Apache Spark Data Pipeline

from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
import logging

class DataPipeline:
    def __init__(self, app_name="DataPipeline"):
        self.spark = SparkSession.builder \\
            .appName(app_name) \\
            .config("spark.sql.adaptive.enabled", "true") \\
            .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \\
            .getOrCreate()
        
        self.logger = logging.getLogger(__name__)
        
    def extract_from_database(self, jdbc_url, table, properties):
        \"\"\"Extract data from database\"\"\"
        try:
            df = self.spark.read.jdbc(
                url=jdbc_url,
                table=table,
                properties=properties
            )
            self.logger.info(f"Successfully extracted {df.count()} rows from {table}")
            return df
        except Exception as e:
            self.logger.error(f"Failed to extract from {table}: {str(e)}")
            raise
    
    def extract_from_api(self, api_endpoint, headers=None):
        \"\"\"Extract data from REST API\"\"\"
        import requests
        import json
        
        response = requests.get(api_endpoint, headers=headers)
        data = response.json()
        
        # Convert to Spark DataFrame
        df = self.spark.createDataFrame(data)
        return df
    
    def extract_from_files(self, file_path, file_format="parquet"):
        \"\"\"Extract data from files\"\"\"
        if file_format == "parquet":
            df = self.spark.read.parquet(file_path)
        elif file_format == "csv":
            df = self.spark.read.option("header", "true").csv(file_path)
        elif file_format == "json":
            df = self.spark.read.json(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_format}")
        
        return df
    
    def transform_data(self, df, transformations):
        \"\"\"Apply data transformations\"\"\"
        
        # Data quality checks
        df = self.validate_data_quality(df)
        
        # Apply transformations
        for transform in transformations:
            if transform['type'] == 'filter':
                df = df.filter(transform['condition'])
            elif transform['type'] == 'select':
                df = df.select(*transform['columns'])
            elif transform['type'] == 'rename':
                for old_name, new_name in transform['mapping'].items():
                    df = df.withColumnRenamed(old_name, new_name)
            elif transform['type'] == 'add_column':
                df = df.withColumn(transform['name'], transform['expression'])
            elif transform['type'] == 'aggregate':
                df = df.groupBy(*transform['group_by']).agg(transform['aggregations'])
            elif transform['type'] == 'join':
                other_df = transform['dataframe']
                df = df.join(other_df, transform['on'], transform['how'])
        
        return df
    
    def validate_data_quality(self, df):
        \"\"\"Validate data quality\"\"\"
        
        # Check for null values
        null_counts = df.select([count(when(col(c).isNull(), c)).alias(c) 
                                for c in df.columns]).collect()[0]
        
        for column, null_count in null_counts.asDict().items():
            if null_count > 0:
                self.logger.warning(f"Column {column} has {null_count} null values")
        
        # Check for duplicates
        total_rows = df.count()
        distinct_rows = df.distinct().count()
        
        if total_rows != distinct_rows:
            duplicates = total_rows - distinct_rows
            self.logger.warning(f"Found {duplicates} duplicate rows")
        
        # Data type validation
        for column in df.columns:
            dtype = dict(df.dtypes)[column]
            self.logger.info(f"Column {column}: {dtype}")
        
        return df
    
    def load_to_warehouse(self, df, table_name, mode="overwrite"):
        \"\"\"Load data to warehouse\"\"\"
        
        # Write to Parquet (for data lake)
        parquet_path = f"s3://data-lake/processed/{table_name}"
        df.write.mode(mode).parquet(parquet_path)
        
        # Write to database (for data warehouse)
        df.write \\
            .format("jdbc") \\
            .option("url", "jdbc:postgresql://warehouse:5432/dwh") \\
            .option("dbtable", table_name) \\
            .option("user", "dwh_user") \\
            .option("password", "password") \\
            .mode(mode) \\
            .save()
        
        self.logger.info(f"Successfully loaded {df.count()} rows to {table_name}")
    
    def run_pipeline(self, config):
        \"\"\"Run the complete pipeline\"\"\"
        
        # Extract
        source_df = None
        if config['source']['type'] == 'database':
            source_df = self.extract_from_database(
                config['source']['jdbc_url'],
                config['source']['table'],
                config['source']['properties']
            )
        elif config['source']['type'] == 'files':
            source_df = self.extract_from_files(
                config['source']['path'],
                config['source']['format']
            )
        
        # Transform
        transformed_df = self.transform_data(source_df, config['transformations'])
        
        # Load
        self.load_to_warehouse(
            transformed_df,
            config['target']['table'],
            config['target']['mode']
        )
        
        return transformed_df

# Usage example
if __name__ == "__main__":
    pipeline = DataPipeline("Sales Data Pipeline")
    
    config = {
        'source': {
            'type': 'database',
            'jdbc_url': 'jdbc:mysql://source:3306/sales',
            'table': 'transactions',
            'properties': {'user': 'user', 'password': 'pass'}
        },
        'transformations': [
            {
                'type': 'filter',
                'condition': col('amount') > 0
            },
            {
                'type': 'add_column',
                'name': 'processed_date',
                'expression': current_timestamp()
            }
        ],
        'target': {
            'table': 'sales_processed',
            'mode': 'append'
        }
    }
    
    result_df = pipeline.run_pipeline(config)`;
  }

  createAirflowDAG(analysis) {
    return `# Apache Airflow DAG

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.operators.bash_operator import BashOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.providers.amazon.aws.operators.s3_file_transform import S3FileTransformOperator
from airflow.providers.spark.operators.spark_submit import SparkSubmitOperator

# Default arguments
default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'catchup': False
}

# Create DAG
dag = DAG(
    'data_pipeline_${analysis.pipelineName || "main"}',
    default_args=default_args,
    description='Main data processing pipeline',
    schedule_interval='@daily',  # Run daily
    max_active_runs=1,
    tags=['data-engineering', 'etl']
)

# Data validation function
def validate_source_data(**context):
    \"\"\"Validate source data before processing\"\"\"
    import pandas as pd
    from great_expectations import DataContext
    
    # Load data
    data_path = context['params']['source_path']
    df = pd.read_csv(data_path)
    
    # Initialize Great Expectations
    context = DataContext()
    
    # Create expectation suite
    suite = context.get_expectation_suite("source_data_validation")
    
    # Run validation
    results = context.run_validation_operator(
        "action_list_operator",
        assets_to_validate=[df],
        run_id=f"validation_{context['ds']}"
    )
    
    if not results['success']:
        raise ValueError("Data validation failed")
    
    return "Data validation passed"

# Data extraction function
def extract_data(**context):
    \"\"\"Extract data from multiple sources\"\"\"
    import pandas as pd
    import boto3
    
    # Extract from database
    db_data = pd.read_sql(
        "SELECT * FROM transactions WHERE date >= %s",
        connection,
        params=[context['ds']]
    )
    
    # Save to S3
    s3_path = f"s3://data-lake/raw/transactions/{context['ds']}/data.parquet"
    db_data.to_parquet(s3_path)
    
    return s3_path

# Data transformation function
def transform_data(**context):
    \"\"\"Transform and clean data\"\"\"
    input_path = context['task_instance'].xcom_pull(task_ids='extract_data')
    output_path = f"s3://data-lake/processed/transactions/{context['ds']}/data.parquet"
    
    # Submit Spark job for transformation
    spark_config = {
        'input_path': input_path,
        'output_path': output_path,
        'transformation_date': context['ds']
    }
    
    return spark_config

# Data quality check function
def check_data_quality(**context):
    \"\"\"Check data quality after transformation\"\"\"
    import pandas as pd
    
    output_path = context['task_instance'].xcom_pull(task_ids='transform_data')['output_path']
    df = pd.read_parquet(output_path)
    
    # Quality checks
    checks = {
        'row_count': len(df) > 0,
        'no_nulls_in_key_columns': df[['id', 'amount']].isnull().sum().sum() == 0,
        'positive_amounts': (df['amount'] > 0).all(),
        'valid_dates': pd.to_datetime(df['transaction_date'], errors='coerce').notna().all()
    }
    
    failed_checks = [check for check, passed in checks.items() if not passed]
    
    if failed_checks:
        raise ValueError(f"Data quality checks failed: {failed_checks}")
    
    return "Data quality checks passed"

# Define tasks
validate_task = PythonOperator(
    task_id='validate_source_data',
    python_callable=validate_source_data,
    params={'source_path': 's3://source-bucket/transactions/'},
    dag=dag
)

extract_task = PythonOperator(
    task_id='extract_data',
    python_callable=extract_data,
    dag=dag
)

transform_task = SparkSubmitOperator(
    task_id='transform_data',
    application='/opt/spark/jobs/transform_data.py',
    name='data_transformation',
    conn_id='spark_default',
    verbose=1,
    application_args=[
        '--input_path', '{{ ti.xcom_pull(task_ids="extract_data") }}',
        '--output_path', 's3://data-lake/processed/transactions/{{ ds }}/',
        '--date', '{{ ds }}'
    ],
    dag=dag
)

quality_check_task = PythonOperator(
    task_id='check_data_quality',
    python_callable=check_data_quality,
    dag=dag
)

load_task = PostgresOperator(
    task_id='load_to_warehouse',
    postgres_conn_id='warehouse_conn',
    sql='''
        COPY processed_transactions 
        FROM 's3://data-lake/processed/transactions/{{ ds }}/data.parquet'
        WITH (FORMAT PARQUET);
    ''',
    dag=dag
)

# Send notification
notify_task = BashOperator(
    task_id='send_notification',
    bash_command='''
        curl -X POST -H 'Content-type: application/json' \\
        --data '{"text":"Pipeline completed successfully for {{ ds }}"}' \\
        $SLACK_WEBHOOK_URL
    ''',
    dag=dag
)

# Define dependencies
validate_task >> extract_task >> transform_task >> quality_check_task >> load_task >> notify_task

# Error handling
def handle_failure(context):
    \"\"\"Handle task failures\"\"\"
    task_instance = context['task_instance']
    error_message = f"Task {task_instance.task_id} failed in DAG {task_instance.dag_id}"
    
    # Send alert
    # Implementation depends on alerting system
    print(f"ALERT: {error_message}")

# Add failure callback to all tasks
for task in dag.tasks:
    task.on_failure_callback = handle_failure`;
  }

  setupStreamProcessing(analysis) {
    return {
      kafka: this.setupKafkaStreaming(analysis),
      spark: this.setupSparkStreaming(analysis),
      flink: this.setupFlinkStreaming(analysis)
    };
  }

  setupKafkaStreaming(analysis) {
    return `# Kafka Streaming Pipeline

from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import KafkaError
import json
import logging
from datetime import datetime

class KafkaStreamProcessor:
    def __init__(self, bootstrap_servers=['localhost:9092']):
        self.bootstrap_servers = bootstrap_servers
        self.logger = logging.getLogger(__name__)
        
    def create_producer(self):
        \"\"\"Create Kafka producer\"\"\"
        return KafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: str(k).encode('utf-8'),
            retries=3,
            acks='all'
        )
    
    def create_consumer(self, topics, group_id):
        \"\"\"Create Kafka consumer\"\"\"
        return KafkaConsumer(
            *topics,
            bootstrap_servers=self.bootstrap_servers,
            group_id=group_id,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            auto_offset_reset='latest',
            enable_auto_commit=True
        )
    
    def process_stream(self, input_topic, output_topic, group_id, processor_func):
        \"\"\"Process streaming data\"\"\"
        consumer = self.create_consumer([input_topic], group_id)
        producer = self.create_producer()
        
        try:
            for message in consumer:
                try:
                    # Process message
                    processed_data = processor_func(message.value)
                    
                    # Send to output topic
                    future = producer.send(
                        output_topic,
                        key=message.key,
                        value=processed_data
                    )
                    
                    # Wait for confirmation
                    future.get(timeout=10)
                    
                    self.logger.info(f"Processed message: {message.key}")
                    
                except Exception as e:
                    self.logger.error(f"Error processing message: {e}")
                    # Send to dead letter queue
                    producer.send('dead_letter_queue', value={
                        'original_message': message.value,
                        'error': str(e),
                        'timestamp': datetime.now().isoformat()
                    })
                    
        except KeyboardInterrupt:
            self.logger.info("Shutting down stream processor")
        finally:
            consumer.close()
            producer.close()

# Example processor function
def enrich_transaction_data(transaction):
    \"\"\"Enrich transaction with additional data\"\"\"
    
    # Add timestamp
    transaction['processed_at'] = datetime.now().isoformat()
    
    # Add derived fields
    transaction['amount_category'] = (
        'high' if transaction['amount'] > 1000 
        else 'medium' if transaction['amount'] > 100 
        else 'low'
    )
    
    # Fraud detection (simplified)
    transaction['fraud_score'] = calculate_fraud_score(transaction)
    transaction['is_suspicious'] = transaction['fraud_score'] > 0.8
    
    return transaction

def calculate_fraud_score(transaction):
    \"\"\"Simple fraud score calculation\"\"\"
    score = 0.0
    
    # High amount transactions
    if transaction['amount'] > 5000:
        score += 0.3
    
    # Late night transactions
    hour = datetime.now().hour
    if hour < 6 or hour > 22:
        score += 0.2
    
    # Multiple transactions from same account
    # (This would require state management in real implementation)
    
    return min(score, 1.0)

# Usage
if __name__ == "__main__":
    processor = KafkaStreamProcessor()
    processor.process_stream(
        input_topic='raw_transactions',
        output_topic='enriched_transactions',
        group_id='transaction_enricher',
        processor_func=enrich_transaction_data
    )`;
  }

  implementDataQuality(analysis) {
    return `# Data Quality Framework

import pandas as pd
import great_expectations as ge
from great_expectations.dataset import PandasDataset
import logging

class DataQualityValidator:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def create_expectation_suite(self, df, suite_name):
        \"\"\"Create expectation suite for data validation\"\"\"
        
        # Convert to Great Expectations dataset
        ge_df = PandasDataset(df)
        
        # Basic expectations
        expectations = []
        
        # Check that table exists and has rows
        expectations.append(
            ge_df.expect_table_row_count_to_be_between(min_value=1)
        )
        
        # Check column existence
        for column in df.columns:
            expectations.append(
                ge_df.expect_column_to_exist(column)
            )
        
        # Numeric columns - check for valid ranges
        numeric_columns = df.select_dtypes(include=['number']).columns
        for column in numeric_columns:
            # Check for null values
            expectations.append(
                ge_df.expect_column_values_to_not_be_null(column)
            )
            
            # Check for reasonable ranges
            min_val, max_val = df[column].min(), df[column].max()
            expectations.append(
                ge_df.expect_column_values_to_be_between(
                    column, min_value=min_val, max_value=max_val
                )
            )
        
        # String columns - check patterns
        string_columns = df.select_dtypes(include=['object']).columns
        for column in string_columns:
            # Check for null values
            expectations.append(
                ge_df.expect_column_values_to_not_be_null(column)
            )
            
            # Check string length
            max_length = df[column].str.len().max()
            expectations.append(
                ge_df.expect_column_value_lengths_to_be_between(
                    column, min_value=1, max_value=max_length
                )
            )
        
        # Datetime columns
        datetime_columns = df.select_dtypes(include=['datetime64']).columns
        for column in datetime_columns:
            expectations.append(
                ge_df.expect_column_values_to_not_be_null(column)
            )
        
        return expectations
    
    def validate_data(self, df, expectations):
        \"\"\"Validate data against expectations\"\"\"
        ge_df = PandasDataset(df)
        
        results = []
        failed_expectations = []
        
        for expectation in expectations:
            try:
                result = expectation
                results.append(result)
                
                if not result['success']:
                    failed_expectations.append(result)
                    
            except Exception as e:
                self.logger.error(f"Error running expectation: {e}")
        
        validation_summary = {
            'total_expectations': len(expectations),
            'successful_expectations': len([r for r in results if r['success']]),
            'failed_expectations': len(failed_expectations),
            'success_percentage': len([r for r in results if r['success']]) / len(expectations) * 100
        }
        
        return validation_summary, failed_expectations
    
    def generate_data_profile(self, df):
        \"\"\"Generate comprehensive data profile\"\"\"
        profile = {
            'shape': df.shape,
            'memory_usage': df.memory_usage(deep=True).sum(),
            'null_counts': df.isnull().sum().to_dict(),
            'null_percentages': (df.isnull().sum() / len(df) * 100).to_dict(),
            'dtypes': df.dtypes.to_dict(),
            'numeric_summary': df.describe().to_dict(),
            'categorical_summary': {}
        }
        
        # Categorical analysis
        categorical_columns = df.select_dtypes(include=['object']).columns
        for column in categorical_columns:
            profile['categorical_summary'][column] = {
                'unique_count': df[column].nunique(),
                'top_values': df[column].value_counts().head(10).to_dict()
            }
        
        return profile
    
    def detect_outliers(self, df, columns=None):
        \"\"\"Detect outliers using IQR method\"\"\"
        if columns is None:
            columns = df.select_dtypes(include=['number']).columns
        
        outliers = {}
        
        for column in columns:
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outlier_mask = (df[column] < lower_bound) | (df[column] > upper_bound)
            outliers[column] = {
                'count': outlier_mask.sum(),
                'percentage': outlier_mask.sum() / len(df) * 100,
                'indices': df[outlier_mask].index.tolist()
            }
        
        return outliers

# Automated data quality monitoring
class DataQualityMonitor:
    def __init__(self, data_source):
        self.data_source = data_source
        self.validator = DataQualityValidator()
        self.logger = logging.getLogger(__name__)
        
    def run_quality_checks(self, df, threshold=90):
        \"\"\"Run comprehensive quality checks\"\"\"
        
        # Generate profile
        profile = self.validator.generate_data_profile(df)
        
        # Create and run expectations
        expectations = self.validator.create_expectation_suite(df, "quality_check")
        validation_summary, failed_expectations = self.validator.validate_data(df, expectations)
        
        # Detect outliers
        outliers = self.validator.detect_outliers(df)
        
        # Overall quality score
        quality_score = validation_summary['success_percentage']
        
        # Quality report
        report = {
            'timestamp': pd.Timestamp.now(),
            'data_source': self.data_source,
            'profile': profile,
            'validation_summary': validation_summary,
            'outliers': outliers,
            'quality_score': quality_score,
            'passed': quality_score >= threshold
        }
        
        # Log results
        if quality_score >= threshold:
            self.logger.info(f"Data quality check passed with score: {quality_score:.2f}%")
        else:
            self.logger.warning(f"Data quality check failed with score: {quality_score:.2f}%")
            for failure in failed_expectations:
                self.logger.warning(f"Failed expectation: {failure}")
        
        return report

# Usage
if __name__ == "__main__":
    # Load data
    df = pd.read_csv('data/transactions.csv')
    
    # Run quality monitoring
    monitor = DataQualityMonitor("transactions_table")
    quality_report = monitor.run_quality_checks(df, threshold=95)
    
    print(f"Quality Score: {quality_report['quality_score']:.2f}%")
    print(f"Status: {'PASSED' if quality_report['passed'] else 'FAILED'}")`;
  }
}

module.exports = DataEngineerSpecialist;