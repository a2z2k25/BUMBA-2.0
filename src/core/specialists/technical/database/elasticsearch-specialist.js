const UnifiedSpecialistBase = require('../../unified-specialist-base');
/**
 * BUMBA Elasticsearch Specialist
 * Expert in Elasticsearch search, analytics, and data management
 */

const SpecialistBase = require('../../specialist-base');

class ElasticsearchSpecialist extends UnifiedSpecialistBase {
  constructor() {
    super({
      name: 'Elasticsearch Specialist',
      expertise: ['Elasticsearch', 'Search', 'Analytics', 'Text Analysis', 'Performance'],
      models: ['claude-3-opus-20240229', 'gpt-4'],
      temperature: 0.3,
      systemPrompt: `You are an Elasticsearch expert specializing in:
        - Search and analytics implementation
        - Index design and mapping optimization
        - Query performance and relevance tuning
        - Cluster architecture and scaling
        - Text analysis and tokenization
        - Aggregations and data analytics
        - Monitoring and troubleshooting
        - Security and access control
        Always prioritize search relevance, performance, and scalability.`
    });

    this.capabilities = {
      indexing: true,
      searching: true,
      analytics: true,
      clustering: true,
      performance: true,
      monitoring: true,
      security: true,
      textAnalysis: true
    };
  }

  async designSearchSystem(context) {
    const analysis = await this.analyze(context);
    
    return {
      mapping: this.createIndexMapping(analysis),
      queries: this.buildSearchQueries(analysis),
      aggregations: this.designAggregations(analysis),
      performance: this.optimizePerformance(analysis)
    };
  }

  createIndexMapping(analysis) {
    return `// Elasticsearch Index Mappings for ${analysis.projectName || 'Application'}

// Products Index Mapping
PUT /products
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "product_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "stop",
            "snowball",
            "synonym_filter"
          ]
        },
        "autocomplete_analyzer": {
          "type": "custom",
          "tokenizer": "keyword",
          "filter": [
            "lowercase",
            "edge_ngram_filter"
          ]
        },
        "search_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "stop",
            "snowball"
          ]
        }
      },
      "filter": {
        "edge_ngram_filter": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 20
        },
        "synonym_filter": {
          "type": "synonym",
          "synonyms": [
            "phone,smartphone,mobile",
            "laptop,notebook,computer",
            "headphones,earphones,headset"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": {
        "type": "keyword"
      },
      "name": {
        "type": "text",
        "analyzer": "product_analyzer",
        "search_analyzer": "search_analyzer",
        "fields": {
          "autocomplete": {
            "type": "text",
            "analyzer": "autocomplete_analyzer",
            "search_analyzer": "search_analyzer"
          },
          "keyword": {
            "type": "keyword"
          }
        }
      },
      "description": {
        "type": "text",
        "analyzer": "product_analyzer"
      },
      "category": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "hierarchy": {
            "type": "text",
            "analyzer": "keyword",
            "fields": {
              "tree": {
                "type": "text",
                "analyzer": "path_hierarchy"
              }
            }
          }
        }
      },
      "brand": {
        "type": "keyword",
        "fields": {
          "text": {
            "type": "text",
            "analyzer": "product_analyzer"
          }
        }
      },
      "price": {
        "type": "scaled_float",
        "scaling_factor": 100
      },
      "original_price": {
        "type": "scaled_float",
        "scaling_factor": 100
      },
      "discount_percentage": {
        "type": "byte"
      },
      "rating": {
        "properties": {
          "average": { "type": "half_float" },
          "count": { "type": "integer" }
        }
      },
      "inventory": {
        "properties": {
          "stock": { "type": "integer" },
          "available": { "type": "boolean" }
        }
      },
      "attributes": {
        "type": "nested",
        "properties": {
          "name": { "type": "keyword" },
          "value": { "type": "keyword" },
          "unit": { "type": "keyword" }
        }
      },
      "tags": {
        "type": "keyword"
      },
      "images": {
        "properties": {
          "url": { "type": "keyword", "index": false },
          "alt": { "type": "text" }
        }
      },
      "created_at": {
        "type": "date"
      },
      "updated_at": {
        "type": "date"
      },
      "is_active": {
        "type": "boolean"
      },
      "popularity_score": {
        "type": "rank_feature"
      },
      "location": {
        "type": "geo_point"
      }
    }
  }
}

// Users Index Mapping
PUT /users
{
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "email": { "type": "keyword" },
      "username": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "profile": {
        "properties": {
          "first_name": { "type": "text" },
          "last_name": { "type": "text" },
          "full_name": {
            "type": "text",
            "copy_to": "search_field"
          },
          "bio": { "type": "text" },
          "location": {
            "properties": {
              "city": { "type": "keyword" },
              "country": { "type": "keyword" },
              "coordinates": { "type": "geo_point" }
            }
          }
        }
      },
      "preferences": {
        "properties": {
          "categories": { "type": "keyword" },
          "brands": { "type": "keyword" },
          "price_range": {
            "type": "integer_range"
          }
        }
      },
      "activity": {
        "properties": {
          "last_login": { "type": "date" },
          "total_orders": { "type": "integer" },
          "total_spent": { "type": "scaled_float", "scaling_factor": 100 }
        }
      },
      "search_field": {
        "type": "text",
        "analyzer": "standard"
      },
      "created_at": { "type": "date" },
      "is_active": { "type": "boolean" }
    }
  }
}

// Content/Articles Index Mapping
PUT /articles
{
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "content_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "stop",
            "stemmer",
            "word_delimiter"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "title": {
        "type": "text",
        "analyzer": "content_analyzer",
        "boost": 2.0
      },
      "content": {
        "type": "text",
        "analyzer": "content_analyzer"
      },
      "summary": {
        "type": "text",
        "analyzer": "content_analyzer"
      },
      "author": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" }
        }
      },
      "categories": { "type": "keyword" },
      "tags": { "type": "keyword" },
      "published_at": { "type": "date" },
      "updated_at": { "type": "date" },
      "status": { "type": "keyword" },
      "view_count": { "type": "integer" },
      "like_count": { "type": "integer" },
      "comment_count": { "type": "integer" }
    }
  }
}`;
  }

  buildSearchQueries(analysis) {
    return `// Elasticsearch Search Queries

// 1. Multi-field Product Search with Boosting
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "wireless headphones",
            "fields": [
              "name^3",
              "name.autocomplete^2",
              "description^1",
              "brand.text^2",
              "category.name^1.5"
            ],
            "type": "best_fields",
            "fuzziness": "AUTO",
            "operator": "and",
            "minimum_should_match": "75%"
          }
        }
      ],
      "filter": [
        {
          "term": {
            "is_active": true
          }
        },
        {
          "range": {
            "price": {
              "gte": 50,
              "lte": 500
            }
          }
        },
        {
          "terms": {
            "brand": ["apple", "sony", "bose"]
          }
        }
      ],
      "should": [
        {
          "range": {
            "rating.average": {
              "gte": 4.0,
              "boost": 1.5
            }
          }
        },
        {
          "function_score": {
            "field_value_factor": {
              "field": "popularity_score",
              "factor": 1.2,
              "modifier": "sqrt",
              "missing": 1
            }
          }
        }
      ]
    }
  },
  "sort": [
    "_score",
    {
      "rating.average": {
        "order": "desc"
      }
    }
  ],
  "highlight": {
    "fields": {
      "name": {},
      "description": {}
    },
    "pre_tags": ["<mark>"],
    "post_tags": ["</mark>"]
  },
  "from": 0,
  "size": 20
}

// 2. Autocomplete Search
GET /products/_search
{
  "query": {
    "bool": {
      "should": [
        {
          "match": {
            "name.autocomplete": {
              "query": "iph",
              "boost": 3
            }
          }
        },
        {
          "match": {
            "name": {
              "query": "iph",
              "fuzziness": "AUTO"
            }
          }
        }
      ]
    }
  },
  "_source": ["name", "brand", "price"],
  "size": 10
}

// 3. Faceted Search with Aggregations
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "category.name": "electronics"
          }
        }
      ],
      "filter": [
        {
          "term": {
            "is_active": true
          }
        }
      ]
    }
  },
  "aggs": {
    "brands": {
      "terms": {
        "field": "brand",
        "size": 20
      }
    },
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 50 },
          { "from": 50, "to": 100 },
          { "from": 100, "to": 500 },
          { "from": 500 }
        ]
      }
    },
    "rating_distribution": {
      "histogram": {
        "field": "rating.average",
        "interval": 1,
        "min_doc_count": 1
      }
    },
    "attributes": {
      "nested": {
        "path": "attributes"
      },
      "aggs": {
        "attribute_names": {
          "terms": {
            "field": "attributes.name",
            "size": 50
          },
          "aggs": {
            "attribute_values": {
              "terms": {
                "field": "attributes.value",
                "size": 20
              }
            }
          }
        }
      }
    }
  },
  "size": 0
}

// 4. Geographic Search (Nearby Products)
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match_all": {}
        }
      ],
      "filter": [
        {
          "geo_distance": {
            "distance": "10km",
            "location": {
              "lat": 37.7749,
              "lon": -122.4194
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "_geo_distance": {
        "location": {
          "lat": 37.7749,
          "lon": -122.4194
        },
        "order": "asc",
        "unit": "km"
      }
    }
  ]
}

// 5. Advanced Content Search
GET /articles/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "machine learning artificial intelligence",
            "fields": ["title^2", "content", "summary^1.5"],
            "type": "best_fields"
          }
        }
      ],
      "filter": [
        {
          "term": {
            "status": "published"
          }
        },
        {
          "range": {
            "published_at": {
              "gte": "now-1y"
            }
          }
        }
      ],
      "should": [
        {
          "terms": {
            "tags": ["technology", "ai", "programming"],
            "boost": 1.5
          }
        }
      ]
    }
  },
  "highlight": {
    "fields": {
      "title": {},
      "content": {
        "fragment_size": 150,
        "number_of_fragments": 3
      }
    }
  },
  "rescore": {
    "window_size": 100,
    "query": {
      "rescore_query": {
        "function_score": {
          "functions": [
            {
              "field_value_factor": {
                "field": "view_count",
                "factor": 0.1,
                "modifier": "log1p"
              }
            },
            {
              "field_value_factor": {
                "field": "like_count",
                "factor": 0.2,
                "modifier": "sqrt"
              }
            }
          ],
          "score_mode": "sum",
          "boost_mode": "multiply"
        }
      }
    }
  }
}

// 6. Suggestion/Did You Mean Query
GET /products/_search
{
  "suggest": {
    "product_suggest": {
      "text": "ipone",
      "term": {
        "field": "name",
        "suggest_mode": "popular",
        "sort": "frequency"
      }
    },
    "product_completion": {
      "text": "ipho",
      "completion": {
        "field": "name.completion",
        "size": 5
      }
    }
  }
}`;
  }

  designAggregations(analysis) {
    return `// Elasticsearch Aggregations for Analytics

// 1. Sales Analytics - Revenue by Category and Time
GET /orders/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        {
          "term": {
            "status": "completed"
          }
        },
        {
          "range": {
            "created_at": {
              "gte": "2024-01-01",
              "lte": "2024-12-31"
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "revenue_over_time": {
      "date_histogram": {
        "field": "created_at",
        "calendar_interval": "month",
        "format": "yyyy-MM"
      },
      "aggs": {
        "total_revenue": {
          "sum": {
            "field": "total_amount"
          }
        },
        "order_count": {
          "value_count": {
            "field": "_id"
          }
        },
        "avg_order_value": {
          "avg": {
            "field": "total_amount"
          }
        },
        "unique_customers": {
          "cardinality": {
            "field": "user_id"
          }
        },
        "category_breakdown": {
          "terms": {
            "field": "items.category",
            "size": 10
          },
          "aggs": {
            "category_revenue": {
              "sum": {
                "field": "items.total_price"
              }
            }
          }
        }
      }
    }
  }
}

// 2. Product Performance Analysis
GET /products/_search
{
  "size": 0,
  "aggs": {
    "category_analysis": {
      "terms": {
        "field": "category.name",
        "size": 20
      },
      "aggs": {
        "avg_price": {
          "avg": {
            "field": "price"
          }
        },
        "price_stats": {
          "extended_stats": {
            "field": "price"
          }
        },
        "rating_distribution": {
          "histogram": {
            "field": "rating.average",
            "interval": 0.5,
            "min_doc_count": 1
          }
        },
        "top_brands": {
          "terms": {
            "field": "brand",
            "size": 5
          },
          "aggs": {
            "avg_rating": {
              "avg": {
                "field": "rating.average"
              }
            }
          }
        },
        "price_vs_rating": {
          "range": {
            "field": "price",
            "ranges": [
              { "to": 100 },
              { "from": 100, "to": 500 },
              { "from": 500 }
            ]
          },
          "aggs": {
            "avg_rating_in_range": {
              "avg": {
                "field": "rating.average"
              }
            }
          }
        }
      }
    }
  }
}

// 3. User Behavior Analytics
GET /user_activity/_search
{
  "size": 0,
  "query": {
    "range": {
      "timestamp": {
        "gte": "now-30d"
      }
    }
  },
  "aggs": {
    "daily_activity": {
      "date_histogram": {
        "field": "timestamp",
        "calendar_interval": "day"
      },
      "aggs": {
        "unique_users": {
          "cardinality": {
            "field": "user_id"
          }
        },
        "activity_types": {
          "terms": {
            "field": "activity_type"
          }
        },
        "hourly_distribution": {
          "date_histogram": {
            "field": "timestamp",
            "calendar_interval": "hour"
          },
          "aggs": {
            "user_count": {
              "cardinality": {
                "field": "user_id"
              }
            }
          }
        }
      }
    },
    "user_segments": {
      "terms": {
        "field": "user_segment",
        "size": 10
      },
      "aggs": {
        "avg_session_duration": {
          "avg": {
            "field": "session_duration"
          }
        },
        "conversion_rate": {
          "bucket_script": {
            "buckets_path": {
              "conversions": "conversions.value",
              "sessions": "_count"
            },
            "script": "params.conversions / params.sessions"
          }
        },
        "conversions": {
          "filter": {
            "term": {
              "activity_type": "purchase"
            }
          }
        }
      }
    }
  }
}

// 4. Search Analytics
GET /search_logs/_search
{
  "size": 0,
  "query": {
    "range": {
      "timestamp": {
        "gte": "now-7d"
      }
    }
  },
  "aggs": {
    "popular_searches": {
      "terms": {
        "field": "query.keyword",
        "size": 50
      },
      "aggs": {
        "avg_results_count": {
          "avg": {
            "field": "results_count"
          }
        },
        "zero_results_rate": {
          "bucket_script": {
            "buckets_path": {
              "zero_results": "zero_results.doc_count",
              "total": "_count"
            },
            "script": "params.zero_results / params.total"
          }
        },
        "zero_results": {
          "filter": {
            "term": {
              "results_count": 0
            }
          }
        }
      }
    },
    "search_trends": {
      "date_histogram": {
        "field": "timestamp",
        "calendar_interval": "hour"
      },
      "aggs": {
        "search_volume": {
          "value_count": {
            "field": "query"
          }
        },
        "unique_queries": {
          "cardinality": {
            "field": "query.keyword"
          }
        }
      }
    },
    "filters_usage": {
      "nested": {
        "path": "filters_applied"
      },
      "aggs": {
        "filter_types": {
          "terms": {
            "field": "filters_applied.type",
            "size": 20
          },
          "aggs": {
            "filter_values": {
              "terms": {
                "field": "filters_applied.value",
                "size": 10
              }
            }
          }
        }
      }
    }
  }
}

// 5. Inventory and Stock Analysis
GET /products/_search
{
  "size": 0,
  "aggs": {
    "stock_levels": {
      "range": {
        "field": "inventory.stock",
        "ranges": [
          { "key": "out_of_stock", "to": 1 },
          { "key": "low_stock", "from": 1, "to": 10 },
          { "key": "medium_stock", "from": 10, "to": 50 },
          { "key": "high_stock", "from": 50 }
        ]
      },
      "aggs": {
        "total_value": {
          "sum": {
            "script": {
              "source": "doc['price'].value * doc['inventory.stock'].value"
            }
          }
        }
      }
    },
    "category_stock_distribution": {
      "terms": {
        "field": "category.name",
        "size": 20
      },
      "aggs": {
        "total_stock": {
          "sum": {
            "field": "inventory.stock"
          }
        },
        "avg_stock_per_product": {
          "avg": {
            "field": "inventory.stock"
          }
        },
        "stock_value": {
          "sum": {
            "script": {
              "source": "doc['price'].value * doc['inventory.stock'].value"
            }
          }
        }
      }
    }
  }
}

// 6. Performance Monitoring Aggregation
GET /_cat/indices?v
GET /_cluster/health
GET /_nodes/stats

// Index statistics aggregation
GET /products/_stats

// Query performance monitoring
GET /_search/slow_log/products
{
  "aggs": {
    "slow_queries_by_hour": {
      "date_histogram": {
        "field": "@timestamp",
        "calendar_interval": "hour"
      },
      "aggs": {
        "avg_query_time": {
          "avg": {
            "field": "took"
          }
        },
        "max_query_time": {
          "max": {
            "field": "took"
          }
        }
      }
    }
  }
}`;
  }

  optimizePerformance(analysis) {
    return `# Elasticsearch Performance Optimization

## Index Settings Optimization
PUT /products/_settings
{
  "index": {
    "refresh_interval": "30s",           // Reduce refresh frequency
    "number_of_replicas": 1,            // Adjust based on needs
    "translog.flush_threshold_size": "1gb",
    "translog.sync_interval": "30s",
    "merge.policy.max_merge_at_once": 5,
    "merge.policy.segments_per_tier": 5
  }
}

## Mapping Optimizations
PUT /products/_mapping
{
  "properties": {
    "description": {
      "type": "text",
      "index_options": "freqs",  // Reduce index size
      "norms": false            // Disable scoring norms if not needed
    },
    "internal_id": {
      "type": "keyword",
      "doc_values": false       // Disable if not used in aggregations
    },
    "metadata": {
      "type": "object",
      "enabled": false          // Don't index if only storage needed
    }
  }
}

## Query Optimization Techniques

// 1. Use filters instead of queries when possible
GET /products/_search
{
  "query": {
    "bool": {
      "filter": [                    // Cached, no scoring
        { "term": { "category": "electronics" } },
        { "range": { "price": { "gte": 100 } } }
      ],
      "must": [                      // Scored queries
        { "match": { "name": "laptop" } }
      ]
    }
  }
}

// 2. Use constant_score for non-scoring queries
GET /products/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "bool": {
          "must": [
            { "term": { "category": "electronics" } },
            { "range": { "price": { "gte": 100, "lte": 1000 } } }
          ]
        }
      },
      "boost": 1.0
    }
  }
}

// 3. Optimize field selection
GET /products/_search
{
  "query": { "match_all": {} },
  "_source": {
    "includes": ["name", "price", "rating"],
    "excludes": ["description", "metadata"]
  }
}

// 4. Use search_type for large result sets
GET /products/_search?scroll=1m&size=1000
{
  "query": { "match_all": {} }
}

## Cluster Configuration

# elasticsearch.yml optimizations
cluster.name: production-cluster
node.name: node-1
node.roles: [ master, data, ingest ]

# Memory settings
bootstrap.memory_lock: true
ES_JAVA_OPTS="-Xms16g -Xmx16g"  # 50% of available RAM

# Network settings
network.host: 0.0.0.0
http.port: 9200
transport.port: 9300

# Discovery settings
discovery.seed_hosts: ["node1", "node2", "node3"]
cluster.initial_master_nodes: ["node1", "node2", "node3"]

# Thread pool settings
thread_pool:
  search:
    size: 13           # Number of CPUs + 1
    queue_size: 1000
  write:
    size: 8            # Number of CPUs
    queue_size: 200

## Index Lifecycle Management (ILM)
PUT /_ilm/policy/logs-policy
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_primary_shard_size": "10gb",
            "max_age": "7d"
          }
        }
      },
      "warm": {
        "min_age": "30d",
        "actions": {
          "allocate": {
            "number_of_replicas": 0
          },
          "shrink": {
            "number_of_shards": 1
          },
          "forcemerge": {
            "max_num_segments": 1
          }
        }
      },
      "cold": {
        "min_age": "90d",
        "actions": {
          "allocate": {
            "include": {
              "box_type": "cold"
            }
          }
        }
      },
      "delete": {
        "min_age": "365d"
      }
    }
  }
}

## Monitoring and Alerting

// Performance monitoring query
GET /_cluster/stats
GET /_nodes/stats/jvm,process,fs
GET /_cat/health?v
GET /_cat/nodes?v&h=name,heap.percent,ram.percent,cpu,load_1m,node.role,master

// Slow query monitoring
PUT /_cluster/settings
{
  "transient": {
    "index.search.slowlog.threshold.query.warn": "10s",
    "index.search.slowlog.threshold.query.info": "5s",
    "index.search.slowlog.threshold.query.debug": "2s",
    "index.search.slowlog.threshold.query.trace": "500ms",
    "index.search.slowlog.threshold.fetch.warn": "1s",
    "index.search.slowlog.threshold.fetch.info": "800ms",
    "index.search.slowlog.threshold.fetch.debug": "500ms",
    "index.search.slowlog.threshold.fetch.trace": "200ms"
  }
}

## Bulk Indexing Optimization
POST /_bulk
{ "index": { "_index": "products", "_id": "1" } }
{ "name": "Product 1", "price": 99.99 }
{ "index": { "_index": "products", "_id": "2" } }
{ "name": "Product 2", "price": 149.99 }

// Bulk indexing with Node.js
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

async function bulkIndex(documents) {
  const body = documents.flatMap(doc => [
    { index: { _index: 'products', _id: doc.id } },
    doc
  ]);

  const response = await client.bulk({
    refresh: false,  // Don't refresh immediately
    body
  });

  if (response.body.errors) {
    console.error('Bulk indexing errors:', response.body.items);
  }

  return response;
}

// Batch processing for large datasets
async function indexLargeDataset(documents, batchSize = 1000) {
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    await bulkIndex(batch);
    
    // Optional: Add delay to prevent overwhelming the cluster
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Refresh index after bulk operation
  await client.indices.refresh({ index: 'products' });
}

## Memory Management
// Force garbage collection
POST /_nodes/_all/_jvm/gc

// Clear field data cache
POST /_cache/clear?fielddata=true

// Clear query cache
POST /_cache/clear?query=true

// Monitor field data usage
GET /_cat/fielddata?v&h=host,field,size

## Index Template for Consistent Settings
PUT /_index_template/products-template
{
  "index_patterns": ["products-*"],
  "template": {
    "settings": {
      "number_of_shards": 3,
      "number_of_replicas": 1,
      "refresh_interval": "30s",
      "analysis": {
        // ... analyzer definitions
      }
    },
    "mappings": {
      // ... mapping definitions
    }
  },
  "priority": 200,
  "version": 1,
  "_meta": {
    "description": "Template for product indices"
  }
}`;
  }

  async troubleshoot(issue) {
    const solutions = {
      slow_queries: [
        'Analyze query execution with _profile API',
        'Check for missing indexes on filtered/sorted fields',
        'Review aggregation performance and cardinality',
        'Consider using filters instead of queries when scoring not needed',
        'Optimize mapping settings (disable norms, doc_values if not needed)'
      ],
      high_memory_usage: [
        'Monitor field data cache usage',
        'Check for large aggregations with high cardinality',
        'Review JVM heap settings (should be 50% of available RAM)',
        'Clear field data cache if necessary',
        'Consider using keyword fields instead of text for aggregations'
      ],
      indexing_issues: [
        'Check bulk indexing batch sizes',
        'Monitor refresh intervals and adjust if needed',
        'Review translog settings',
        'Check for mapping conflicts',
        'Monitor disk space and I/O performance'
      ],
      cluster_health: [
        'Check cluster health status',
        'Review shard allocation and rebalancing',
        'Monitor node resources (CPU, memory, disk)',
        'Check for split-brain scenarios',
        'Review discovery and network settings'
      ]
    };
    
    return solutions[issue.type] || ['Review Elasticsearch logs and cluster stats'];
  }
}

module.exports = ElasticsearchSpecialist;