/**
 * Monitoring Module
 * 
 * This module handles the creation and configuration of monitoring resources.
 */

# Create notification channels
resource "google_monitoring_notification_channel" "notification_channels" {
  for_each = { for channel in var.notification_channels : channel.display_name => channel }
  
  project      = var.project_id
  display_name = each.value.display_name
  type         = each.value.type
  
  # Set labels based on the channel type
  labels = each.value.type == "email" ? {
    email_address = each.value.email
  } : {}
  
  # Force new resource if the email address changes
  lifecycle {
    create_before_destroy = true
  }
}

# Create alert policies
resource "google_monitoring_alert_policy" "alert_policies" {
  for_each = { for policy in var.alert_policies : policy.display_name => policy }
  
  project      = var.project_id
  display_name = each.value.display_name
  combiner     = "OR"  # Any condition being met will trigger the alert
  
  # Set up conditions for the alert
  dynamic "condition" {
    for_each = each.value.conditions
    
    content {
      display_name = condition.value.display_name
      
      condition_threshold {
        filter          = condition.value.condition_threshold.filter
        duration        = condition.value.condition_threshold.duration
        comparison      = condition.value.condition_threshold.comparison
        threshold_value = condition.value.condition_threshold.threshold_value
      }
    }
  }
  
  # Set up notification channels
  notification_channels = [
    for channel in google_monitoring_notification_channel.notification_channels : channel.id
  ]
  
  # Add documentation
  documentation {
    content   = each.value.documentation.content
    mime_type = each.value.documentation.mime_type
  }
}

# Create a custom dashboard for Fluxori
resource "google_monitoring_dashboard" "fluxori_dashboard" {
  project        = var.project_id
  dashboard_json = jsonencode({
    displayName = "Fluxori Operations Dashboard",
    gridLayout = {
      widgets = [
        {
          title = "Cloud Run - Backend CPU Usage",
          xyChart = {
            dataSets = [
              {
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${var.backend_service_name}\" AND metric.type=\"run.googleapis.com/container/cpu/utilization\"",
                    aggregation = {
                      alignmentPeriod = "60s",
                      perSeriesAligner = "ALIGN_MEAN"
                    }
                  }
                },
                plotType = "LINE"
              }
            ],
            timeshiftDuration = "0s",
            yAxis = {
              label = "y1Axis",
              scale = "LINEAR"
            }
          }
        },
        {
          title = "Cloud Run - Backend Memory Usage",
          xyChart = {
            dataSets = [
              {
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${var.backend_service_name}\" AND metric.type=\"run.googleapis.com/container/memory/utilizations\"",
                    aggregation = {
                      alignmentPeriod = "60s",
                      perSeriesAligner = "ALIGN_MEAN"
                    }
                  }
                },
                plotType = "LINE"
              }
            ],
            timeshiftDuration = "0s",
            yAxis = {
              label = "y1Axis",
              scale = "LINEAR"
            }
          }
        },
        {
          title = "Cloud Run - Backend Request Count",
          xyChart = {
            dataSets = [
              {
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${var.backend_service_name}\" AND metric.type=\"run.googleapis.com/request_count\"",
                    aggregation = {
                      alignmentPeriod = "60s",
                      perSeriesAligner = "ALIGN_RATE"
                    }
                  }
                },
                plotType = "LINE"
              }
            ],
            timeshiftDuration = "0s",
            yAxis = {
              label = "y1Axis",
              scale = "LINEAR"
            }
          }
        },
        {
          title = "AI Credits Remaining",
          xyChart = {
            dataSets = [
              {
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "metric.type=\"custom.googleapis.com/fluxori/ai_credits_remaining\" AND resource.type=\"global\"",
                    aggregation = {
                      alignmentPeriod = "60s",
                      perSeriesAligner = "ALIGN_MEAN"
                    }
                  }
                },
                plotType = "LINE"
              }
            ],
            timeshiftDuration = "0s",
            yAxis = {
              label = "y1Axis",
              scale = "LINEAR"
            }
          }
        },
        {
          title = "Firestore - Read Operations",
          xyChart = {
            dataSets = [
              {
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"firestore_instance\" AND metric.type=\"firestore.googleapis.com/document/read_count\"",
                    aggregation = {
                      alignmentPeriod = "60s",
                      perSeriesAligner = "ALIGN_RATE"
                    }
                  }
                },
                plotType = "LINE"
              }
            ],
            timeshiftDuration = "0s",
            yAxis = {
              label = "y1Axis",
              scale = "LINEAR"
            }
          }
        },
        {
          title = "Firestore - Write Operations",
          xyChart = {
            dataSets = [
              {
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"firestore_instance\" AND metric.type=\"firestore.googleapis.com/document/write_count\"",
                    aggregation = {
                      alignmentPeriod = "60s",
                      perSeriesAligner = "ALIGN_RATE"
                    }
                  }
                },
                plotType = "LINE"
              }
            ],
            timeshiftDuration = "0s",
            yAxis = {
              label = "y1Axis",
              scale = "LINEAR"
            }
          }
        }
      ]
    }
  })
}

# Create a custom metric for AI credits
resource "google_monitoring_metric_descriptor" "ai_credits_metric" {
  project      = var.project_id
  description  = "Remaining AI usage credits for users"
  display_name = "AI Credits Remaining"
  type         = "custom.googleapis.com/fluxori/ai_credits_remaining"
  metric_kind  = "GAUGE"
  value_type   = "INT64"
  
  labels {
    key         = "organization_id"
    value_type  = "STRING"
    description = "The organization ID"
  }
  
  labels {
    key         = "user_id"
    value_type  = "STRING"
    description = "The user ID"
  }
}