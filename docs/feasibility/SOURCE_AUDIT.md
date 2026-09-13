# Canterbury source and catchment feasibility audit

**Audit run:** 2026-09-13T10:30:56Z

**Status:** Verified for the profiled public endpoints; owner decision required for scope selection.

This audit is a source-feasibility screen, not a selected-catchment or analytical-method decision. The reproducible command is:

```text
python3 tools/feasibility_audit.py --output docs/feasibility/audit-report.json
```

The command retrieves source metadata and compact catalogs only. It does not download or commit raw observations. The machine-readable result is [audit-report.json](audit-report.json).

## Verified source evidence

The live run retrieved all records reported by the endpoints for the requested scopes:

| Source | Evidence retrieved | Relevant contract evidence |
| --- | ---: | --- |
| [ECan surface-water ArcGIS layer](https://gis.ecan.govt.nz/arcgis/rest/services/Public/WaterQualityandMonitoring/MapServer/0) | 6,266 / 6,266 features | Point stations; `SITE_ID`, `SITE_NAME`, source/type, NZTM2000 coordinates, source link; max page 1,000; JSON/GeoJSON/PBF advertised |
| [ECan historical flow-site ArcGIS layer](https://gis.ecan.govt.nz/arcgis/rest/services/Public/WaterQualityandMonitoring/MapServer/6) | 185 / 185 features | Site name/number, telemetered flag, gauging count, first/last gauging, NZTM2000 coordinates |
| [ECan Hilltop site list](http://wateruse.ecan.govt.nz/wqlawa.hts?Service=Hilltop&Request=SiteList&Location=LatLong) | 552 sites | Hilltop XML site identifiers and WGS84 coordinates |
| [ECan Hilltop WFS measurement list](http://wateruse.ecan.govt.nz/wqlawa.hts?Service=WFS&Request=GetFeature&TypeName=MeasurementList) | 16,425 site/measurement entries | WFS 1.1.0 XML; `Site`, `Measurement`, `From`, `To` date bounds |
| ECan Hilltop per-site `Units=Yes` probe | 1,728 entries across 45 joined sites | Measurement units where supplied, `WQData`, `Discrete` interpolation, sensor groups, item counts, and date bounds |

The measurement catalog demonstrates useful historical depth and common analytes. It does not itself provide observation values, quality flags, censored-result semantics, or a canonical catchment field. Those remain Priority 2 acquisition work.

The [ECan water-quality publication page](https://www.ecan.govt.nz/data/water-quality-data) states that the database includes ECan and external-party results, supports site-level download/print, and may lag sampling by up to three months for quality checks. The [ECan developer portal](https://apidevelopers.ecan.govt.nz/) currently advertises river flow through its Environmental Observations API, while the [API terms](https://apidevelopers.ecan.govt.nz/terms) describe account/subscription, batch-call, attribution, provider-change, and use constraints. The audit did not assume that a portal account is available.

The [LAWA download catalog](https://www.lawa.org.nz/download-data) is a credible national alternative and describes a South Island river-water-quality file covering 2004–2024, including Canterbury. Its bulk file was not downloaded in this compact audit; licensing and field compatibility must be checked before choosing LAWA as the primary acquisition route.

## Candidate screening

Candidate membership is a reproducible screening proxy: Hilltop sites are joined to the nearest ECan surface-water station after NZTM2000-to-WGS84 conversion within 0.002 degrees, then the ECan station name is matched against documented aliases. It is not authoritative polygon membership and must not be treated as final catchment geography.

`Common parameters` means distinct measurement names available at two or more coordinate-linked Hilltop sites. It is intentionally broader than the final four-to-six parameter set.

| Candidate | ECan surface stations by name | Linked Hilltop sites | Measurement entries | Common parameters | Flow sites by name | Nitrate-N/Nitrite-N bounds (linked sites) |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Ashburton–Hakatere | 37 | 10 | 458 | 72 | 8 | 1995-10-12 to 2026-06-30; 9 sites |
| Rangitata | 23 | 10 | 281 | 56 | 1 | 1995-07-11 to 2026-06-04; 7 sites |
| Hurunui | 30 | 8 | 267 | 67 | 5 | 2005-04-28 to 2026-06-10; 8 sites |
| Selwyn–Waikirikiri | 22 | 4 | 209 | 72 | 4 | 1992-08-18 to 2026-06-25; 3 sites |
| Ashley–Rakahuri | 19 | 5 | 185 | 52 | 4 | 1999-08-16 to 2026-06-11; 4 sites |
| Waimakariri | 24 | 5 | 158 | 36 | 4 | 2007-09-19 to 2026-06-19; 5 sites |
| Rakaia | 25 | 3 | 155 | 61 | 4 | 2001-07-16 to 2026-06-16; 3 sites |

Across the screened candidates, the common core names have consistent observed units where supplied: E. coli `MPN/100mL`, nitrate-nitrite `g/m3`, dissolved reactive phosphorus `mg/L`, total nitrogen and total phosphorus `g/m3`, turbidity `NTU`, and dissolved oxygen `mg/L`. pH was marked discrete but had no units value in the probed metadata. This is source metadata evidence, not an adopted normalization rule.

## Interpretation and recommendation

Verified evidence supports Canterbury feasibility. The quantitative screen is strongest for Ashburton–Hakatere: it has the largest name-screened station inventory, the most linked measurement entries, and eight name-matched flow sites. Rangitata has strong water-quality depth but only one flow-site name match. Waimakariri and Ashley–Rakahuri are smaller, coherent alternatives with multiple flow-site matches and broad overlap in the core measurement names.

Recommended owner-review shortlist:

1. Ashburton–Hakatere for maximum profiled data depth and flow context.
2. Waimakariri or Ashley–Rakahuri as smaller alternatives if geographic coherence and a tighter station network are preferred.

Before implementation proceeds, the owner must select the exact catchment and parameter direction after polygon-based membership and observation-level profiling. No catchment, final parameters, trend estimator, threshold, status label, or causal interpretation has been adopted here. A plausible provisional analysis window is 2007–2024 because several common parameters span that period at some linked sites; completeness and sampling density must be measured from observations first.

## Constraints, limitations, and next work

- The ECan surface layer includes rivers, streams, estuaries, drains, lakes, and other surface-water sites. Name aliases can include non-target sites and do not define a contained catchment.
- The audit did not acquire full observation values, so record-level duplicates, missingness, censored values, quality flags, numeric ranges, and sampling frequency are not yet verified.
- Flow feasibility is demonstrated at the inventory level. A selected catchment still needs a defensible gauge-to-monitoring relationship; flow must remain contextual and not be used to infer causation.
- Units are profiled from per-site metadata but are not normalized. Original values and units must be preserved in Priority 2.
- The audit did not approve redistribution terms. Before release, review [ECan API terms](https://apidevelopers.ecan.govt.nz/terms), ECan water-quality terms linked from the publication page, and the license metadata for any LAWA or ArcGIS derivative.
- The endpoint can be slow or change. The tool fails on incomplete pages or source errors rather than treating partial retrieval as complete.

Next work is owner selection, followed by the Priority 1 contract foundation. Priority 2 should then perform polygon joins and a small observation-level acquisition/profile against the selected source route.
