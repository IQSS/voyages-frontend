# CRC-Voyages-React-App

This repository contains a React application written principally by Thasanee Puttamadilok that will stand as the new frontend for the SlaveVoyages project starting in 2025.

It uses Vite and React, TypeScript, Redux-toolkit, and Material-UI.

[![](https://img.shields.io/badge/npm-9.6.6-brightgreen)](https://shields.io) [![](https://img.shields.io/badge/node-v20.2.0-orange)](https://shields.io)

Proposed changes to the repository are made on working branches off of _develop_. Accepted changes are integrated into _main_ in order to be deployed.

---

## Installation

To run this application locally, you'll need to have Node.js installed on your machine.

1. use nvm (Node version management) tool make sure node -version is "correct"
   1. Check your local node version by `node -v` and npm version with `npm -v`
   1. Make sure the versions are same as top of this README

After cloning the repository, navigate to the project directory and install the dependencies.

To instantiate the project, use npm ci, which relies on the ```package-lock.json``` file. Then, force the installation of mirador using ```npm install```, but without saving it to package.json by using the ```--no-save``` flag. (mirador has an unresolved bug)

	npm ci \                                 
	&& npm i --force mirador@"^3.3.0" --no-save \
	&& npm run build \

However, if you change your version of node, or install a new package in the course of development, you will need to update your package files. In that case, you will need to remove:

	rm -rf node_modules \
	npm i \
	npm ci \                                 
	&& npm i --force mirador@"^3.3.0" --no-save \
	&& npm run build \

Please only follow this procedure if absolutely necessary: if a package needs updating, node needs an upgrade, or a new package is required for your development work on the project.

**3. Authorization**

In the `.env_sample`, you need to set `VITE_API_AUTHTOKEN` and `VITE_API_BASEURL` and change file name to `.env`

Example:

    VITE_API_AUTHTOKEN = 'Token ABCDEF.... (replace it with your authentication token)'
    VITE_API_BASEURL = 'https://voyages.ilove.you.haha..... (replace it with your own url for api call)'
    VITE_IIIF_MANIFESTS_BASEURL = 'https://location.ofstatic.manifests/withatrailingslashplease/'

**4. Run Application**

    npm run dev

**5. Run Test Application**

    npm run test

## Project Structure

The project is structured as follows:

      │── public/
      │── src/
      │   ├── assets
      │   ├── components
      │   │     ├── Cascading
      │   │     │     ├── CascadingMenu
      │   │     │     ├── CascadingMenuMobile
      │   │     │     ├── Dropdown
      │   │     │     ├── MenuListDropdown
      │   │     │     ├── MenuListDropdownPeople.tsx
      │   │     │     ├── NestedMenuItem
      │   │     │     ├── PaperDraggable
      │   │     ├── FunctionComponents
      │   │     │     ├──  ColumnSelectorTable
      │   │     │     │      ├── ButtonDropdownSelectoreColumn
      │   │     │     │      ├── ColumnSelector
      │   │     │     │      ├── DropdownColumn
      │   │     │     │      ├── NestedMenuColumnItem
      │   │     │     ├── AutocompletedTree
      │   │     │     ├── CustomHeader
      │   │     │     ├── TableCharacter
      │   │     │     ├── TableRangeSlider
      │   │     │── header
      │   │     │     ├── drawerMenuBar
      │   │     │     ├── HeaderNavar
      │   │     │     ├── HeaderSearchLogo
      │   │     │── Home
      │   │     │     ├── stylesMenu
      │   │     │     │      ├── StyledBurger
      │   │     │     │      ├── SytledMenu
      │   │     │     ├── BurgerMenu
      │   │     │     ├── Menu
      │   │     │     ├── MenuDropdownProps
      │   │     │── PastPeople
      │   │     │     ├── Enslaved
      │   │     │     │      ├── ColumnSelectorEnslavedTable
      |   │     │     │      │      ├── ButtonDropdownSelectorEnslaved
      │   │     │     │      ├── HeaderEnslaved
      |   │     │     │      │      ├── HeaderEnslavedNavBar
      │   │     │     |      ├── EnslavedPage
      │   │     │     |      ├── EnslavedPageScrolling
      │   │     │     |      ├── EnslavedTable
      │   │     │     ├── Enslaved
      │   │     │     │      ├── ColumnSelectorEnslaversTable
      |   │     │     │      │      ├── ButtonDropdownSelectorEnslavers
      │   │     │     │      ├── HeaderEnslavers
      |   │     │     │      │      ├── HeaderEnslaversNavBar
      │   │     │     |      ├── EnslaversPage
      │   │     │     |      ├── EnslaversPageScrolling
      │   │     │     |      ├── EnslaversTable
      │   │     │     ├── Header
      │   │     │     │      ├── DrawerMenuPeopleBar
      |   │     │     │      ├── NavBarPeople
      │   │     │     ├── PastPeoplePage
      │   │     │── voyagePage
      │   │     │     ├── Results
      │   │     │     │      ├── RadioSelected
      │   │     │     │      ├── AutocompletedBox
      │   │     │     │      ├── BarGraph
      │   │     │     │      ├── PieGraph
      │   │     │     │      ├── RangeSlider
      │   │     │     │      ├── Scatter
      │   │     │     │      ├── SelectDropdown
      │   │     │     │      ├── VoyagesHompPage
      │   │     │     │      ├── VoyagesTable
      │   │     │     ├── ScrollPage
      │   │── fetchAPI
      │   │     ├── pastEnslaved
      │   │     │     ├── fetchEnslavedOptionsList
      │   │     │     ├── fetchPastEnslavedApiService
      │   │     │     ├── fetchPastEnslavedAutoCompleted
      │   │     │     ├── fetchPastEnslavedRangeSliderData
      │   │     │     ├── fetchVoyageSortedEnslavedTableData
      │   │     ├── voyagesApi
      │   │     │     ├── fetchApiService
      │   │     │     ├── fetchAutoCompleted
      │   │     │     ├── fetchOptionsData
      │   │     │     ├── fetchOptionsFlat
      │   │     │     ├── fetchRangeSliderData
      │   │     │     ├── fetchVoyageGroupby
      │   │     │     ├── fetchVoyageOptionsPagination
      │   │     │     ├── fetchVoyagesOptionsApi
      │   │     │     ├── fetchVoyageSortedData
      │   │── pages
      │   │     ├── Enslaved
      │   │     ├── Enslavers
      │   │     ├── Home
      │   │     ├── PastPage
      │   │     ├── VoyagesPage
      │   │── redux
      │   │     ├── getAutoCompleteSlice
      │   │     ├── getColumnSlice
      │   │     ├── getDataSetCollectionSlice
      │   │     ├── getFilterPeopleObjectSlice
      │   │     ├── getFilterSlice
      │   │     ├── getOptionsDataPastPeopleEnslavedSlice
      │   │     ├── getOptionsDataSlice
      │   │     ├── getOptionsFlatObjSlice
      │   │     ├── getPeopleEnlavedDataSetCollectionSlice
      │   │     ├── getScrollEnlavedPageSlice
      │   │     ├── getScrollPageSlice
      │   │     ├── getTableSlice
      │   │     ├── rangeSliderSlice
      │   │     ├── store
      │   │── share
      │   │     ├── AUTH_BASEURL
      │   │     ├── CONST_DATA
      │   │     ├── InterfaceTypes
      │   │     ├── InterfaceTypesTable
      │   │     ├── InterfactTypesDatasetCollection
      │   │     ├── PeopleCollectionType
      │   │── style
      │   │     ├── homepage.scss
      │   │     ├── index.css
      │   │     ├── Nav.scss
      │   │     ├── page-past.scss
      │   │     ├── page.scss
      │   │     ├── Slider.scss
      │   │     ├── table.scss
      │   │── styleMUI
      │   │     ├── index.ts
      │   │     ├── thems.ts
      │   │── tests
      │   │     ├── components
      │   │     ├── flat-files
      │   │     │     ├── BARGRAPH_OPTIONS.test.ts
      │   │     │     ├── PIECHART_OPTIONS.test.ts
      │   │     │     ├── SCATTER_OPTIONS.test.ts
      │   │     │     ├── Table_Cell_Structure.test.ts
      │   │     │     ├── transatlantic_voyages_filter_menu.test.ts
      │   │     ├── redux-test
      │   │     │     ├── getDataSetCollection.test.ts
      │   │     ├── untils-test
      │   │     │     ├── valueGetter.test.ts
      │   │── utils
      │   │     ├── flatfiles
      │   │     │     ├── enslaved_african_origins_filter_menu.json
      │   │     │     ├── enslaved_african_origins_table.json
      │   │     │     ├── enslaved_filter_menu.json
      │   │     │     ├── enslaved_options.json
      │   │     │     ├── enslaved_table_cell_structure.json
      │   │     │     ├── people_page_data.json
      │   │     │     ├── enslaved_texas_filter_menu.json
      │   │     │     ├── enslaved_texas_table_cell_structure.json
      │   │     │     ├── transatlantic_voyages_filter_menu_SIMPLE.json
      │   │     │     ├── voyages_transatlantic_filter_menu.json
      │   │     │     ├── varnamechecker.py
      │   │     │     ├── voyages_bargraph_options.json
      │   │     │     ├── voyages_collections.json
      │   │     │     ├── voyages_piechart_options.json
      │   │     │     ├── voyages_scatter_options.json
      │   │     │     ├── voyages_transatlantic_table.json
      │   │     ├── functions
      │   │     │     ├── generateRowsData.ts
      │   │     │     ├── getRowsPerPage.ts
      │   │     │     ├── getColorStyle.ts
      │   │     │     ├── hasValueGetter.ts
      │   │     │     ├── TableCollectionsOptions.ts
      │   │     │     ├── traverseData.ts
      │   │── App.tsx
      │   └── main.tsx
      |── .env
      |── eslintrc
      |── .gitignore
      |── .prettierrc
      |── index.html
      |── package.json
      |── tsconfig.json
      |── vite-env.d.ts
      |── vite.config.js

## Features

This application is a simple search engine for the CRC Voyages database. It allows users to search for voyages based on various criteria such as the ship name, captain's name, or embarkation port. The search results are displayed in a table that can be sorted by various columns.

The application also includes a form for adding new voyages to the database, although this functionality is not yet fully implemented.

## Contribution runtime

The EKS container supplies `window.__VOYAGES_RUNTIME_CONFIG__` in `/runtime-config.js` before the application loads. Its contribution settings are `contributeApiBaseUrl` (default `/contribute-api`), `supabaseUrl`, and the public `supabaseAnonKey`. Local development may use the matching `VITE_API_BASE_NODE_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` values from the environment sample.

Keep `apiAuthToken` for Django requests. Contribution requests use the signed-in user's Supabase bearer token; never put a Supabase service-role key or a Node-to-Django service credential in browser configuration. The Supabase project must allow the candidate origin and `/auth/callback` and `/auth/reset-password` redirect URLs.

The contribution package remains locked at version 0.6.12. Installing dependencies requires a GitHub Packages token with access to `@slavevoyages/voyages-contribute`; provide it through an untracked, temporary npm configuration. Production deployments remain owned by `IQSS/voyages-control`.

## Building for Production

    javascipt
    npm run build

This will create an optimized build in the dist/ directory. The build artifacts can be deployed to a web server or hosting platform.

## Conclusion

This documentation provided an overview and guide to the application built using Vite, React, TypeScript, Redux Toolkit, and Material UI. It covered the project structure, key features

## License

This project is licensed under the MIT License.
