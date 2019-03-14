import React from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator, FlatList, BackHandler, Image } from 'react-native';
import { createStackNavigator, createAppContainer } from 'react-navigation';
import RadioForm, {RadioButton, RadioButtonInput, RadioButtonLabel} from 'react-native-simple-radio-button';
import SVGImage from 'react-native-svg-image';

// class HomeScreen extends React.Component {
//   render() {
//     return (
//       <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
//         <Text>Home Screen</Text>
//         <Button
//           title="Go to Matches"
//           onPress={() => this.props.navigation.navigate('Matches')}
//         />
//       </View>
//     );
//   }
// }

class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Partidos',
    headerStyle: {
      backgroundColor: '#0066ff',
    },
    headerTintColor: 'white',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  };

  constructor(props){
    super(props);
    this.state = {
      teams: [],
      matches: [],
      gaps: [],
      // teamImages: [],
      isMatchesLoading: true,
      isStandingsLoading: true,
      isGapsLoading: true,
      // isImagesLoading: true
    }
    //this.getTeamImages();
  }

  componentDidMount(){
    this.getStandings();
    this.getMatches();
    this.getGaps();
  }

  async getStandings() {
    try {
      const response = await fetch('https://abacus-api.herokuapp.com/api/teams/');
      const responseJson = await response.json();
      var teams = [];
      for (var i = 0; i < responseJson.data.length; i++) {
        teams.push({
          id: responseJson.data[i].id,
          position: responseJson.data[i].position,
          teamId: responseJson.data[i].teamId,
          name: responseJson.data[i].name,
          crest: responseJson.data[i].crest,
          played: responseJson.data[i].played,
          won: responseJson.data[i].won,
          draw: responseJson.data[i].draw,
          lost: responseJson.data[i].lost,
          points: responseJson.data[i].points,
          goalsFor: responseJson.data[i].goalsFor,
          goalsAgainst: responseJson.data[i].goalsAgainst,
          goalsDiff: responseJson.data[i].goalsDiff,
          teamsDiff: {}
        });
      }
      this.setState({
        isStandingsLoading: false,
        // standingsData: responseJson,
        teams: teams,
      }, function () {
      });
    }
    catch (error) {
      console.error(error);
    }
  }

  async getMatches() {
    try {
      const response = await fetch('https://abacus-api.herokuapp.com/api/matches/');
      const responseJson = await response.json();
      var matches = [];
      for (var i = 0; i < responseJson.data.length; i++) {
        if (responseJson.data[i].status != 'FINISHED'){
          var homeCrest = responseJson.data[i].homeCrest;
          var awayCrest = responseJson.data[i].awayCrest;
          var defaultCrest = 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/default-team-logo-500.png';
          try {
            const homeImageResp = await fetch(homeCrest);
            if (homeImageResp.status === 404) {
              homeCrest = defaultCrest;
            }
            const awayImageResp = await fetch(awayCrest);
            if (awayImageResp.status === 404) {
              awayCrest = defaultCrest;
            }
            Image.prefetch(homeCrest);
            Image.prefetch(awayCrest);
          } catch (error) {
            console.log(error);
          }
          matches.push({
            awayTeamGoals: responseJson.data[i].awayTeamGoals,
            awayTeamId: responseJson.data[i].awayTeamId,
            awayTeamName: responseJson.data[i].awayTeamName,
            homeTeamGoals: responseJson.data[i].homeTeamGoals,
            homeTeamId: responseJson.data[i].homeTeamId,
            homeTeamName: responseJson.data[i].homeTeamName,
            id: responseJson.data[i].id,
            matchId: responseJson.data[i].matchId,
            matchday: responseJson.data[i].matchday,
            status: responseJson.data[i].status,
            utcDate: responseJson.data[i].utcDate,
            homeCrest: homeCrest,
            awayCrest: awayCrest
          });
        }
      }
      this.setState({
        isMatchesLoading: false,
        // matchesData: responseJson,
        matches: matches
      }, function () {
      });
    }
    catch (error) {
      console.error(error);
    }
  }

  async getGaps() {
    try {
      const response = await fetch('https://abacus-api.herokuapp.com/api/gaps/');
      const responseJson = await response.json();
      var gaps = {};
      for (var i = 0; i < responseJson.data.length; i++) {
        gaps[responseJson.data[i].teamId+'_'+responseJson.data[i].awayTeamId] = responseJson.data[i].diff
      }
      this.setState({
        isGapsLoading: false,
        // gapsData: responseJson,
        gaps: gaps
      }, function () {
      });
    }
    catch (error) {
      console.error(error);
    }
  }

  selectResult(value, item) {
    var teams = this.state.teams;
    var gaps = this.state.gaps;

    for (var i=0; i<teams.length; i++) {
      if(teams[i].id == item.homeTeamId) {
        teams[i].teamsDiff[item.id] = 0;
        if(value == '1') {
          teams[i].teamsDiff[item.id] += 3;
          gaps[item.homeTeamId+'_'+item.awayTeamId] = 1;
        } else if(value == '2') {
          teams[i].teamsDiff[item.id] += 1;
          gaps[item.homeTeamId+'_'+item.awayTeamId] = 0;
        } else if(value == '3') {
          teams[i].teamsDiff[item.id] += 0;
          gaps[item.homeTeamId+'_'+item.awayTeamId] = -1;
        }
      }
      if(teams[i].id == item.awayTeamId) {
        teams[i].teamsDiff[item.id] = 0;
        if(value == '1') {
          teams[i].teamsDiff[item.id] += 0;
        } else if(value == '2') {
          teams[i].teamsDiff[item.id] += 1;
        } else if(value == '3') {
          teams[i].teamsDiff[item.id] += 3;
        }
      }
    }
    
    this.setState({
      teams: teams,
      gaps: gaps
    }, function () {
    });
  }

  render() {
    if(this.state.isMatchesLoading || this.state.isStandingsLoading){
      return(
        <View style={styles.activity_indicator}>
          <ActivityIndicator size={'large'}/>
        </View>
      )
    }

    return (
      <View style={{ flex: 1}}>
        <FlatList
          data={this.state.matches.sort((a, b) => (a.matchday - b.matchday))}
          renderItem={({item}) =>
            <View style={styles.match_container}>
              <View style={styles.container_team_left}>
                <Text style={styles.match_title_left}>{item.homeTeamName}</Text>
                <SVGImage source={{uri: item.homeCrest}} style={styles.photo} scalesPageToFit={true}/>
              </View>
              <RadioForm
                radio_props={[
                  {label: '', value: '1'},
                  {label: '', value: '2'},
                  {label: '', value: '3'}
                ]}
                initial={-1}
                onPress={(value) => {this.selectResult(value, item)}}
                formHorizontal={true}
                labelHorizontal={false}
                borderWidth={1}
                buttonSize={25}
                buttonOuterSize={35}
                buttonStyle={{}}
                buttonWrapStyle={{margin: 4}}
              />
              <View style={styles.container_team_right}>
                <SVGImage source={{uri: item.awayCrest}} style={styles.photo} scalesPageToFit={true}/>
                <Text style={styles.match_title_right}>{item.awayTeamName}</Text>
              </View>
            </View>
          }
          keyExtractor={(item, index) => 'match_'+item.id}
        />
        <Button
          title="Calcular"
          onPress={() => this.props.navigation.navigate('CalculatedTable', {
            teams: this.state.teams,
            gaps: this.state.gaps
          })}
        />
      </View>
    );
  }
}

class CalculatedTableScreen extends React.Component {
  static navigationOptions = {
    title: 'Clasificación',
    headerStyle: {
      backgroundColor: '#0066ff',
    },
    headerTintColor: 'white',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
    headerLeft: null
  };

  _didFocusSubscription;
  _willBlurSubscription;

  constructor(props){
    super(props);

    this._didFocusSubscription = props.navigation.addListener('didFocus', payload =>
      BackHandler.addEventListener('hardwareBackPress', this.onBackButtonPressAndroid)
    );

    this.state = {
      teams: this.props.navigation.getParam('teams', []),
      gaps: this.props.navigation.getParam('gaps', []),
      orderedTeams: []
    }
  }

  componentDidMount(){
    this._willBlurSubscription = this.props.navigation.addListener('willBlur', payload =>
      BackHandler.removeEventListener('hardwareBackPress', this.onBackButtonPressAndroid)
    );

    this.setPoints();
    this.sortTable();
  }

  onBackButtonPressAndroid = () => {
    this.clearPoints();
  };
  
  componentWillUnmount() {
    this._didFocusSubscription && this._didFocusSubscription.remove();
    this._willBlurSubscription && this._willBlurSubscription.remove();
  }

  setPoints() {
    var teams = this.state.teams
    for (var i=0; i<teams.length; i++) {
      var teamsDiffMap = teams[i].teamsDiff
      for (var key in teamsDiffMap) {
        var pts = teamsDiffMap[key]
        teams[i].points += pts;
        teams[i].played += 1;
        if(pts == 3) {
          teams[i].won += 1;
          teams[i].goalsFor += 1;
          teams[i].goalsDiff += 1;
        } else if(pts == 1) {
          teams[i].draw += 1;
        } else if(pts == 0) {
          teams[i].lost +=1 ;
          teams[i].goalsAgainst += 1;
          teams[i].goalsDiff -= 1;
        }
      }
    }
  }

  clearPoints() {
    var teams = this.state.teams
    for (var i=0; i<teams.length; i++) {
      var teamsDiffMap = teams[i].teamsDiff
      for (var key in teamsDiffMap) {
        var pts = teamsDiffMap[key]
        teams[i].points -= pts;
        teams[i].played -= 1;
        if(pts == 3) {
          teams[i].won -= 1;
          teams[i].goalsFor -= 1;
          teams[i].goalsDiff -= 1;
        } else if(pts == 1) {
          teams[i].draw -= 1;
        } else if(pts == 0) {
          teams[i].lost -=1 ;
          teams[i].goalsAgainst -= 1;
          teams[i].goalsDiff += 1;
        }
      }
    }
  }

  sortTable() {
    var sortedTeams = []
    var groupBy = function(xs, key) {
      return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
      }, {});
    };

    var teams = this.state.teams
    var gaps = this.state.gaps
    var groupedTeams = groupBy(teams, 'points')

    for (var key in groupedTeams) {
      var groupTeamsList = groupedTeams[key]
      var groupedTeamsLength = groupTeamsList.length
      if (groupedTeamsLength < 2) {
        sortedTeams.unshift(groupTeamsList[0]);
      } else if (groupedTeamsLength == 2) {
        var teamA = groupTeamsList[0];
        var teamB = groupTeamsList[1];
        var diff = (gaps[teamA.id+'_'+teamB.id] || 0) - (gaps[teamB.id+'_'+teamA.id] || 0);
        if (diff < 0) {
          sortedTeams.unshift(teamA);
          sortedTeams.unshift(teamB);
        } else if (diff > 0) {
          sortedTeams.unshift(teamB);
          sortedTeams.unshift(teamA);
        } else {
          var globalDiff = teamA.goalsDiff - teamB.goalsDiff
          if (globalDiff < 0) {
            sortedTeams.unshift(teamA);
            sortedTeams.unshift(teamB);
          } else if (globalDiff > 0) {
            sortedTeams.unshift(teamB);
            sortedTeams.unshift(teamA);
          } else {
            var globalFor = teamA.goalsFor - teamB.goalsFor
            if (globalFor < 0) {
              sortedTeams.unshift(teamA);
              sortedTeams.unshift(teamB);
            } else if (globalFor > 0) {
              sortedTeams.unshift(teamB);
              sortedTeams.unshift(teamA);
            } else {
              // Default sorting
              sortedTeams.unshift(teamA);
              sortedTeams.unshift(teamB);
            }
          }
        }
      } else if (groupedTeamsLength > 2) {
        for (var v=0; v<groupedTeamsLength; v++) {
          groupTeamsList[v].sub = {};
          groupTeamsList[v].sub.diff = 0;
          groupTeamsList[v].sub.pts = 0;
        }
        for (var i=0; i<groupedTeamsLength; i++) {
          for (var j=0; j<groupedTeamsLength; j++) {
            if (i != j) {
              var gap = gaps[groupTeamsList[i].id+'_'+groupTeamsList[j].id] || 0;
              groupTeamsList[i].sub['diff'] += gap;
              groupTeamsList[j].sub['diff'] -= gap;
              if ( gap < 0) {
                groupTeamsList[j].sub['pts'] += 3;
              } else if (gap > 0) {
                groupTeamsList[i].sub['pts'] += 3;
              } else if (gap == 0){
                groupTeamsList[i].sub['pts'] += 1;
                groupTeamsList[j].sub['pts'] += 1;
              } else {
                // - Not played yet. -
              }
            }
          }
        }
        groupTeamsList.sort(function(a, b){
          if (a.sub.pts == b.sub.pts) {
            if (a.sub.diff == b.sub.diff) {
              if (a.goalsDiff == b.goalsDiff) {
                b.goalsFor - a.goalsFor
              } else {
                b.goalsDiff - a.goalsDiff
              }
            } else {
              return b.sub.diff - a.sub.diff
            }
          } else {
            return b.sub.pts - a.sub.pts;
          }
        });
        
        for (var v=0; v<groupTeamsList.length; v++) {
          sortedTeams.unshift(groupTeamsList[v]);
        }
      }
    }

    this.setState({
      sortedTeams: sortedTeams
    }, function(){

    });
  }

  render() {
    return (
      <View style={styles.table_view}>
        <View style={styles.table_head}>
          <Text style={styles.standing_head}>#</Text>
          <Text style={styles.title_head}>Equipo</Text>
          <Text style={styles.info_head}>PJ</Text>
          <Text style={styles.info_head}>PTS</Text>
          <Text style={styles.info_head}>DIFF</Text>
        </View>
        <View style={styles.table_body}>
          <FlatList
            data={this.state.sortedTeams}
            renderItem={({item, index}) =>
              <CustomRow
                standing={index+1}
                name={item.name}
                points={item.points}
                crest={item.crest}
                played={item.played}
                shift={item.position-(index+1)}
              />
            }
            keyExtractor={(item, index) => 'team_'+item.id}
          />
        </View>
      </View>
    );
  }
}

const CustomRow = ({ standing, name, points, crest, played, shift }) => (
  <View style={styles.container}>
    {
      (standing==1 || standing==2 || standing==3 || standing==4) ? <Text style={styles.standing1}>{standing}</Text>
      :
        (standing==5) ? <Text style={styles.standing2}>{standing}</Text>
        : (standing==6) ? <Text style={styles.standing3}>{standing}</Text>
          : (standing==18 || standing==19 || standing==20) ? <Text style={styles.standing4}>{standing}</Text>
            : <Text style={styles.standing}>{standing}</Text>
    }
    <SVGImage source={{uri: crest}} style={styles.photo} scalesPageToFit={true}/>
    <Text style={styles.title}>{name}</Text>
    <Text style={styles.info}>{played}</Text>
    <Text style={styles.infoPts}>{points}</Text>
    {shift<0 ? <Text style={styles.shiftDown}>-</Text> : (shift>0 ? <Text style={styles.shiftUp}>+</Text> : <Text style={styles.shiftEqual}>=</Text>)}
  </View>
);

const RootStack = createStackNavigator(
  {
    Home: HomeScreen,
    // Matches: MatchesScreen,
    CalculatedTable: CalculatedTableScreen,
  },
  {
    initialRouteName: 'Home'
    // headerMode: 'none',
    // navigationOptions: {
    //     headerVisible: false,
    // }
  }
);

export default createAppContainer(RootStack);

const styles = StyleSheet.create({
  match_container: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 5,
    marginLeft:5,
    marginRight:5,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 5,
    elevation: 2,
  },
  activity_indicator: {
    flex: 1,
    padding: 200
  },
  container_team_left: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 10,
  },
  container_team_right: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 10,
  },
  match_title_left: {
    fontSize: 10,
    color: '#000',
    width: 50,
    textAlign: 'right',
    padding: 5,
  },
  match_title_right: {
    fontSize: 10,
    color: '#000',
    width: 50,
    textAlign: 'left',
    padding: 5,
  },
  match_photo: {
    height: 50,
  },
  table_view: {
    flex: 1,
    borderRadius: 5,
    elevation: 2,
    padding: 10,
    marginLeft:10,
    marginRight:10,
    marginTop: 4,
    marginBottom: 4,
  },
  table_head: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#e6e6e6',
    // borderColor: 'grey',
    // borderWidth: 1,
    borderRadius: 5,
    margin: 5,
    paddingTop: 20,
  },
  standing_head: {
    fontSize: 13,
    color: '#000',
    textAlign: 'left',
    textAlign: 'center',
    width: 35,
  },
  title_head: {
    fontSize: 15,
    color: '#000',
    textAlign: 'left',
    textAlign: 'center',
    width: 150,
    paddingRight: 50,
  },
  info_head: {
    fontSize: 11,
    color: '#000',
    textAlign: 'left',
    textAlign: 'center',
    width: 35,
  },
  table_body: {
    flex: 11,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    marginLeft:5,
    marginRight:5,
    backgroundColor: '#FFF',
    borderBottomColor: 'black',
    borderBottomWidth: 1,
  },
  standing: {
    fontSize: 16,
    borderColor: 'black',
    borderWidth: 1,
    textAlign: 'center',
    borderRadius: 5,
    padding: 8,
    margin: 8,
    elevation: 2,
    height: 35,
    width: 35,
  },
  standing1: {
    fontSize: 16,
    backgroundColor: '#003399',
    color: 'white',
    borderColor: 'black',
    borderWidth: 1,
    textAlign: 'center',
    borderRadius: 5,
    padding: 8,
    margin: 8,
    elevation: 2,
    height: 35,
    width: 35,
  },
  standing2: {
    fontSize: 16,
    backgroundColor: '#660033',
    color: 'white',
    borderColor: 'black',
    borderWidth: 1,
    textAlign: 'center',
    borderRadius: 5,
    padding: 8,
    margin: 8,
    elevation: 2,
    height: 35,
    width: 35,
  },
  standing3: {
    fontSize: 16,
    backgroundColor: '#FF33cc',
    color: 'white',
    borderColor: 'black',
    borderWidth: 1,
    textAlign: 'center',
    borderRadius: 5,
    padding: 8,
    margin: 8,
    elevation: 2,
    height: 35,
    width: 35,
  },
  standing4: {
    fontSize: 16,
    backgroundColor: '#CC0000',
    color: 'white',
    borderColor: 'black',
    borderWidth: 1,
    textAlign: 'center',
    borderRadius: 5,
    padding: 8,
    margin: 8,
    elevation: 2,
    height: 35,
    width: 35,
  },
  photo: {
    width: 50,
    borderRadius: 5,
  },
  title: {
    fontSize: 16,
    color: '#000',
    width: 100,
    textAlign: 'left',
    padding: 8,
  },
  info: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 8,
    width: 30,
  },
  infoPts: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 8,
    width: 30,
  },
  shiftUp: {
    fontSize: 16,
    backgroundColor: '#99FF66',
    borderColor: 'black',
    borderWidth: 1,
    textAlign: 'center',
    borderRadius: 5,
    padding: 8,
    margin: 8,
    elevation: 2,
    height: 35,
    width: 35,
  },
  shiftDown: {
    fontSize: 16,
    backgroundColor: '#FF5050',
    borderColor: 'black',
    borderWidth: 1,
    textAlign: 'center',
    borderRadius: 5,
    padding: 8,
    margin: 8,
    elevation: 2,
    height: 35,
    width: 35,
  },
  shiftEqual: {
    fontSize: 16,
    backgroundColor: '#FFF',
    borderColor: 'black',
    borderWidth: 1,
    textAlign: 'center',
    borderRadius: 5,
    padding: 8,
    margin: 8,
    elevation: 2,
    height: 35,
    width: 35,
  },
});
