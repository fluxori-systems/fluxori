# SmartProxy Quota Allocation Strategy

This document outlines the strategy for allocating SmartProxy quota across marketplaces, with a focus on efficiently collecting historical product pricing data from Buck.cheap while maintaining ongoing data collection from primary marketplaces.

## Overview

The quota allocation strategy is designed to be dynamic and responsive to collection progress, front-loading resources for Buck.cheap historical data collection while ensuring critical marketplace monitoring continues uninterrupted.

## Phase-Based Allocation Approach

The system uses a phase-based approach to gradually transition from high initial allocation for Buck.cheap to a sustainable baseline allocation:

| Phase | Completion Range | Buck.cheap Allocation | Description                                                             |
| ----- | ---------------- | --------------------- | ----------------------------------------------------------------------- |
| 1     | 0% - 30%         | 15%                   | Initial front-loaded allocation to kickstart historical data collection |
| 2     | 30% - 75%        | 10%                   | Moderate allocation for steady collection progress                      |
| 3     | 75% - 95%        | 7%                    | Reduced allocation as we approach completion                            |
| 4     | 95% - 100%       | 4.2%                  | Final sustainable baseline allocation                                   |

## Marketplace Quota Distribution

### Initial Collection Phase (0-30% complete)

- **Buck.cheap**: 15% of quota
- **Takealot**: 29.5% of quota (vs. 34.7% baseline)
- **Amazon**: 23.6% of quota (vs. 27.8% baseline)
- **Bob Shop**: 10.6% of quota (vs. 12.5% baseline)
- **Makro**: 10.6% of quota (vs. 12.5% baseline)
- **Loot**: 7.1% of quota (vs. 8.3% baseline)
- Other marketplaces: Proportional adjustment to remaining 3.6%

### Final Base Allocation (100% complete)

- **Buck.cheap**: 4.2% of quota
- **Takealot**: 34.7% of quota
- **Amazon**: 27.8% of quota
- **Bob Shop**: 12.5% of quota
- **Makro**: 12.5% of quota
- **Loot**: 8.3% of quota

## Dynamic Resource Distribution

As historical data collection progresses and Buck.cheap allocation reduces, freed resources are proportionally redistributed to other marketplaces based on their baseline allocations:

1. Calculate the difference between current Buck.cheap allocation and baseline allocation
2. Distribute this "resource surplus" proportionally to other marketplaces
3. This ensures a smooth transition without disrupting any marketplace's data collection

## Implementation Details

The implementation leverages several components:

1. **Quota Manager**: Tracks and enforces quota limits across marketplaces
2. **Ranking Orchestrator**: Coordinates historical data collection tasks
3. **Task Scheduler Config**: Defines the allocation phases and marketplace configurations
4. **Buck.cheap Scraper**: Implements the historical data collection
5. **Price History Extractor**: Focuses on extracting CSV history and product IDs

## Collection Strategy

The collection strategy optimizes for efficiency:

1. **Front-Loaded Scheduling**: Multiple parallel collection tasks during initial phase
2. **Priority Management**: Higher initial priority that gradually reduces
3. **CSV Focus**: Prioritizes finding and processing CSV price history files
4. **Product ID Matching**: Special focus on extracting Takealot PLID codes and Makro product IDs
5. **Validation**: Regular validation of collected data for consistency and completeness

## Operational Procedures

The following procedures are implemented to manage the quota allocation:

1. **Daily Allocation Updates**: Automatic recalculation of allocations based on collection progress
2. **Phase Transitions**: Smooth transitions between allocation phases as progress milestones are reached
3. **Collection Monitoring**: Regular status checks of collection progress and resource usage
4. **Issue Remediation**: Detection and addressing of collection issues or gaps

## Metrics and Reporting

The system tracks and reports on the following metrics:

1. Collection progress percentage (overall and per marketplace)
2. Current allocation percentages across marketplaces
3. Collection rates and efficiency
4. Data validation metrics and issue rates
5. Phase transition history

## Conclusion

This quota allocation strategy ensures efficient historical data collection while minimizing impact on ongoing marketplace monitoring. The phase-based approach allows for aggressive initial collection that gradually transitions to a sustainable baseline allocation.
