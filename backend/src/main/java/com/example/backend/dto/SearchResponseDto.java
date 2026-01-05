package com.example.backend.dto;

import java.util.List;

public class SearchResponseDto {
    private List<SearchResultDto> results;
    private long totalHits;
    private boolean elasticsearchAvailable;

    public SearchResponseDto() {
    }

    public SearchResponseDto(List<SearchResultDto> results, long totalHits, boolean elasticsearchAvailable) {
        this.results = results;
        this.totalHits = totalHits;
        this.elasticsearchAvailable = elasticsearchAvailable;
    }

    public List<SearchResultDto> getResults() {
        return results;
    }

    public void setResults(List<SearchResultDto> results) {
        this.results = results;
    }

    public long getTotalHits() {
        return totalHits;
    }

    public void setTotalHits(long totalHits) {
        this.totalHits = totalHits;
    }

    public boolean isElasticsearchAvailable() {
        return elasticsearchAvailable;
    }

    public void setElasticsearchAvailable(boolean elasticsearchAvailable) {
        this.elasticsearchAvailable = elasticsearchAvailable;
    }
}
