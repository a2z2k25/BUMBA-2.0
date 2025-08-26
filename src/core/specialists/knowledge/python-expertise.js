/**
 * BUMBA Python Deep Expertise
 * Comprehensive knowledge base for Python specialist
 * Sprint 7 Enhancement
 */

class PythonExpertise {
  /**
   * Enhanced Python Knowledge Template
   */
  static getPythonExpertise() {
    return {
      name: 'Python Expert',
      
      expertise: {
        core: {
          language: 'Python 3.12+, PEP standards, CPython internals, GIL understanding',
          typing: 'Type hints, mypy, pydantic, runtime validation, protocols',
          async: 'asyncio, aiohttp, async generators, event loops, coroutines',
          performance: 'Cython, NumPy vectorization, multiprocessing, threading',
          memory: 'Memory profiling, garbage collection, __slots__, weak references'
        },
        
        webFrameworks: {
          fullstack: ['Django 5.0+', 'Django REST Framework', 'Django Channels'],
          microframeworks: ['Flask', 'FastAPI', 'Quart', 'Starlette', 'Sanic'],
          async: ['FastAPI', 'aiohttp', 'Tornado', 'Quart'],
          graphql: ['Strawberry', 'Graphene', 'Ariadne'],
          admin: ['Django Admin', 'Flask-Admin', 'FastAPI Admin']
        },
        
        dataScience: {
          analysis: ['Pandas', 'NumPy', 'SciPy', 'Statsmodels'],
          visualization: ['Matplotlib', 'Seaborn', 'Plotly', 'Bokeh', 'Altair'],
          ml: ['scikit-learn', 'XGBoost', 'LightGBM', 'CatBoost'],
          deepLearning: ['TensorFlow', 'PyTorch', 'Keras', 'JAX'],
          nlp: ['spaCy', 'NLTK', 'Transformers', 'Gensim'],
          computer_vision: ['OpenCV', 'Pillow', 'scikit-image'],
          notebooks: ['Jupyter', 'JupyterLab', 'Google Colab', 'Papermill']
        },
        
        databases: {
          orm: ['SQLAlchemy', 'Django ORM', 'Peewee', 'Tortoise ORM', 'SQLModel'],
          drivers: ['psycopg2', 'pymongo', 'redis-py', 'aiomysql', 'asyncpg'],
          migrations: ['Alembic', 'Django Migrations', 'Flyway'],
          nosql: ['pymongo', 'motor', 'cassandra-driver', 'elasticsearch-py']
        },
        
        testing: {
          frameworks: ['pytest', 'unittest', 'nose2', 'doctest'],
          mocking: ['unittest.mock', 'pytest-mock', 'responses', 'freezegun'],
          coverage: ['coverage.py', 'pytest-cov'],
          bdd: ['behave', 'pytest-bdd', 'lettuce'],
          property: ['hypothesis', 'pytest-quickcheck'],
          load: ['locust', 'pytest-benchmark']
        },
        
        devOps: {
          packaging: ['setuptools', 'Poetry', 'pip', 'pipenv', 'pdm', 'hatch'],
          containerization: ['Docker', 'docker-compose', 'Kubernetes'],
          ci_cd: ['GitHub Actions', 'GitLab CI', 'Jenkins', 'CircleCI'],
          deployment: ['Gunicorn', 'uWSGI', 'Uvicorn', 'Hypercorn'],
          monitoring: ['Prometheus', 'Grafana', 'Sentry', 'New Relic']
        },
        
        patterns: {
          design: ['Singleton', 'Factory', 'Observer', 'Strategy', 'Decorator'],
          architectural: ['MVC', 'MVT', 'Clean Architecture', 'Hexagonal', 'DDD'],
          async: ['Producer-Consumer', 'Pub-Sub', 'Event Sourcing'],
          api: ['REST', 'GraphQL', 'gRPC', 'WebSocket', 'Server-Sent Events']
        }
      },
      
      capabilities: [
        'Modern Python development (3.12+)',
        'Web framework expertise (Django, FastAPI, Flask)',
        'Data science and machine learning',
        'Async programming with asyncio',
        'Database design and optimization',
        'API development (REST, GraphQL, gRPC)',
        'Testing strategies and TDD',
        'Package management and distribution',
        'Performance optimization',
        'Microservices architecture',
        'Data pipeline development',
        'Scientific computing',
        'Automation and scripting',
        'Cloud deployment (AWS, GCP, Azure)',
        'DevOps and CI/CD'
      ],
      
      codePatterns: {
        asyncWebServer: `
# FastAPI async web server with dependency injection
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import asyncio

app = FastAPI(title="Async API", version="1.0.0")

# Dependency injection for database session
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# Async endpoint with proper error handling
@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    user = await UserService.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.from_orm(user)`,
        
        dataClassValidation: `
# Pydantic model with validation and serialization
from pydantic import BaseModel, Field, validator, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    age: Optional[int] = Field(None, ge=0, le=150)
    role: UserRole = UserRole.USER
    
    @validator('username')
    def username_alphanumeric(cls, v):
        assert v.isalnum(), 'Username must be alphanumeric'
        return v
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase letter')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "username": "johndoe",
                "password": "SecurePass123",
                "age": 25
            }
        }`,
        
        contextManager: `
# Context manager for resource management
from contextlib import contextmanager, asynccontextmanager
import asyncio
from typing import Generator, AsyncGenerator

@contextmanager
def database_transaction(connection):
    """Synchronous context manager for database transactions"""
    transaction = connection.begin()
    try:
        yield connection
        transaction.commit()
    except Exception:
        transaction.rollback()
        raise
    finally:
        connection.close()

@asynccontextmanager
async def async_database_transaction(connection):
    """Async context manager for database transactions"""
    transaction = await connection.begin()
    try:
        yield connection
        await transaction.commit()
    except Exception:
        await transaction.rollback()
        raise
    finally:
        await connection.close()

# Usage with async context manager
async def process_data():
    async with async_database_transaction(conn) as db:
        await db.execute("INSERT INTO users VALUES (?)", data)`,
        
        decoratorPattern: `
# Advanced decorator with arguments and async support
from functools import wraps
from typing import Callable, Any
import asyncio
import time
import logging

def retry(max_attempts: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """Retry decorator with exponential backoff"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            attempt = 0
            current_delay = delay
            
            while attempt < max_attempts:
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    attempt += 1
                    if attempt >= max_attempts:
                        logging.error(f"Max attempts reached for {func.__name__}")
                        raise
                    
                    logging.warning(f"Attempt {attempt} failed: {e}")
                    await asyncio.sleep(current_delay)
                    current_delay *= backoff
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            attempt = 0
            current_delay = delay
            
            while attempt < max_attempts:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    attempt += 1
                    if attempt >= max_attempts:
                        raise
                    time.sleep(current_delay)
                    current_delay *= backoff
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator`,
        
        dataProcessingPipeline: `
# Data processing pipeline with pandas and async
import pandas as pd
import numpy as np
from typing import Optional, Dict, Any
import asyncio
from concurrent.futures import ProcessPoolExecutor

class DataPipeline:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.executor = ProcessPoolExecutor(max_workers=config.get('workers', 4))
    
    async def process_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process data batch with async operations"""
        # Data cleaning
        df = await self.clean_data(df)
        
        # Feature engineering
        df = await self.engineer_features(df)
        
        # Parallel processing for CPU-intensive operations
        loop = asyncio.get_event_loop()
        df = await loop.run_in_executor(
            self.executor,
            self._cpu_intensive_processing,
            df
        )
        
        return df
    
    async def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Async data cleaning"""
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Handle missing values
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        df[numeric_columns] = df[numeric_columns].fillna(df[numeric_columns].median())
        
        # Async validation
        await self.validate_data(df)
        
        return df
    
    def _cpu_intensive_processing(self, df: pd.DataFrame) -> pd.DataFrame:
        """CPU-intensive operations for multiprocessing"""
        # Complex calculations
        df['computed_metric'] = df.apply(
            lambda row: self._complex_calculation(row),
            axis=1
        )
        return df`,
        
        sqlAlchemyModels: `
# SQLAlchemy 2.0 models with async support
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.asyncio import AsyncAttrs
from datetime import datetime
from typing import List, Optional

Base = declarative_base()

class TimestampMixin:
    """Mixin for automatic timestamps"""
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

class User(AsyncAttrs, Base, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = (
        Index('idx_user_email', 'email'),
        Index('idx_user_username', 'username'),
    )
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    
    # Relationships
    posts: Mapped[List["Post"]] = relationship(
        back_populates="author",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username})>"`,
        
        testingPatterns: `
# Comprehensive testing with pytest
import pytest
from unittest.mock import Mock, patch, AsyncMock
from hypothesis import given, strategies as st
import asyncio

# Fixtures for test setup
@pytest.fixture
async def async_client():
    """Async test client fixture"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def mock_database(mocker):
    """Mock database fixture"""
    mock_db = mocker.MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None
    return mock_db

# Parametrized testing
@pytest.mark.parametrize("input_value,expected", [
    ("valid@email.com", True),
    ("invalid.email", False),
    ("", False),
    (None, False),
])
def test_email_validation(input_value, expected):
    assert is_valid_email(input_value) == expected

# Async testing
@pytest.mark.asyncio
async def test_async_endpoint(async_client):
    response = await async_client.get("/users/1")
    assert response.status_code == 200
    assert "id" in response.json()

# Property-based testing with Hypothesis
@given(st.lists(st.integers(), min_size=1))
def test_sorting_property(input_list):
    sorted_list = custom_sort(input_list)
    assert len(sorted_list) == len(input_list)
    assert all(sorted_list[i] <= sorted_list[i+1] for i in range(len(sorted_list)-1))

# Mock testing
@patch('module.external_api_call')
async def test_with_mock(mock_api_call):
    mock_api_call.return_value = {"status": "success"}
    result = await process_with_external_api()
    assert result["status"] == "success"
    mock_api_call.assert_called_once()`
      },
      
      bestPractices: [
        'Use type hints for all function signatures',
        'Follow PEP 8 style guide consistently',
        'Write docstrings for all public functions and classes',
        'Use virtual environments for dependency isolation',
        'Pin dependencies with exact versions in production',
        'Implement proper logging instead of print statements',
        'Use async/await for I/O-bound operations',
        'Leverage multiprocessing for CPU-bound tasks',
        'Write comprehensive tests with pytest',
        'Use context managers for resource management',
        'Implement proper error handling and custom exceptions',
        'Use dataclasses or Pydantic for data validation',
        'Profile code before optimizing',
        'Use linting tools (pylint, flake8, black, mypy)',
        'Follow the Zen of Python principles'
      ],
      
      packageManagement: {
        tools: ['pip', 'Poetry', 'pipenv', 'conda', 'pdm', 'hatch'],
        
        bestPractices: [
          'Use Poetry or pipenv for dependency management',
          'Create requirements.txt for pip compatibility',
          'Separate dev and production dependencies',
          'Use semantic versioning for packages',
          'Create setup.py or pyproject.toml for distribution',
          'Use virtual environments consistently',
          'Lock dependencies with exact versions',
          'Regularly update dependencies for security'
        ],
        
        distribution: {
          pypi: 'Upload packages to PyPI with twine',
          wheels: 'Build wheels for faster installation',
          conda: 'Create conda packages for scientific computing',
          docker: 'Containerize applications for deployment'
        }
      },
      
      debuggingCapabilities: [
        'pdb/ipdb interactive debugging',
        'VS Code Python debugger',
        'PyCharm debugger',
        'Memory profiling with memory_profiler',
        'Line profiling with line_profiler',
        'cProfile for performance analysis',
        'py-spy for production profiling',
        'Remote debugging with debugpy',
        'Logging with structured logs',
        'Tracing with OpenTelemetry'
      ],
      
      systemPromptAdditions: `
You are an expert Python developer with deep knowledge of:
- Modern Python 3.12+ features and best practices
- Web frameworks (Django, FastAPI, Flask)
- Data science and machine learning libraries
- Async programming with asyncio
- Database design with SQLAlchemy and Django ORM
- Testing strategies with pytest
- Package management with Poetry and pip
- Performance optimization techniques
- Microservices and cloud deployment
- DevOps practices and CI/CD

When writing Python code:
- Always use type hints for better code clarity
- Follow PEP 8 style guide strictly
- Write comprehensive docstrings
- Implement proper error handling
- Use async/await for I/O operations
- Leverage Python's standard library
- Write testable, modular code
- Use appropriate data structures
- Implement logging instead of print statements
- Consider performance implications
- Follow the Zen of Python principles`
    };
  }
  
  /**
   * Get data science specific expertise
   */
  static getDataScienceExpertise() {
    return {
      libraries: {
        core: ['NumPy', 'Pandas', 'SciPy'],
        visualization: ['Matplotlib', 'Seaborn', 'Plotly', 'Bokeh'],
        ml: ['scikit-learn', 'XGBoost', 'LightGBM'],
        dl: ['TensorFlow', 'PyTorch', 'Keras'],
        stats: ['statsmodels', 'scipy.stats']
      },
      
      techniques: {
        preprocessing: [
          'Feature scaling and normalization',
          'Handling missing data',
          'Encoding categorical variables',
          'Feature engineering',
          'Dimensionality reduction (PCA, t-SNE)'
        ],
        
        modeling: [
          'Linear/Logistic regression',
          'Decision trees and Random Forests',
          'Gradient boosting',
          'Support Vector Machines',
          'Neural networks',
          'Clustering algorithms',
          'Time series analysis'
        ],
        
        evaluation: [
          'Cross-validation',
          'Hyperparameter tuning',
          'Model selection',
          'Performance metrics',
          'A/B testing',
          'Statistical hypothesis testing'
        ]
      },
      
      workflows: {
        eda: 'Exploratory Data Analysis',
        feature_engineering: 'Creating meaningful features',
        model_training: 'Training and validation pipelines',
        deployment: 'Model serving with MLflow, BentoML',
        monitoring: 'Model drift detection and retraining'
      }
    };
  }
}

module.exports = PythonExpertise;