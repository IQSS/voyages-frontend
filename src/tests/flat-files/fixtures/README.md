# API option-field fixture

`api-option-fields.json` records the sorted field names accepted by the API's
checked-in option dictionaries. It contains no records or credentials and is
independent of the frontend menus under test.

Source: `IQSS/voyages-api` commit
`9b24f1b221c772a846c5ecd4ffd10370cb1cebcf`, files:

- `src/api/common/static/Voyage_options.py`
- `src/api/common/static/Enslaved_options.py`
- `src/api/common/static/EnslaverIdentity_options.py`

The current enslaver list request serializer uses `EnslaverIdentity_options`,
not the older `Enslaver_options` dictionary. The API commit adds the public
`gender__name` filter and the supported `enslaver__source__ALL` search field;
backend tests exercise request validation and `common.reqs.post_req` for both.

Chart `__bins__<positive integer>` suffixes are grouping instructions handled
by the voyage statistics endpoint. Tests check the underlying field and keep
different aggregations of the same field as distinct series.

Refresh this fixture from a reviewed API checkout when its accepted fields
change; do not derive it from the frontend menu names. From the frontend root:

```bash
API_SOURCE=/absolute/path/to/voyages-api python3 - <<'PY'
import json
import os
from pathlib import Path
import runpy

source = Path(os.environ['API_SOURCE']) / 'src/api/common/static'
names = ['Voyage', 'Enslaved', 'EnslaverIdentity']
fields = {
    name: sorted(runpy.run_path(str(source / f'{name}_options.py'))[f'{name}_options'])
    for name in names
}
Path('src/tests/flat-files/fixtures/api-option-fields.json').write_text(
    json.dumps(fields, indent=2) + '\n'
)
PY
```

Update the source commit above after refreshing. These tests make no HTTP
requests. Live candidate acceptance remains a separate validation.
