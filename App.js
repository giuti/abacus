import React from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator, FlatList, BackHandler } from 'react-native';
import { createStackNavigator, createAppContainer } from 'react-navigation';
import RadioForm, {RadioButton, RadioButtonInput, RadioButtonLabel} from 'react-native-simple-radio-button';

class HomeScreen extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Home Screen</Text>
        <Button
          title="Go to Matches"
          onPress={() => this.props.navigation.navigate('Matches')}
        />
      </View>
    );
  }
}

class MatchesScreen extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      teams: [],
      matches: [],
      gaps: [],
      isMatchesLoading: true,
      isStandingsLoading: true,
      isGapsLoading: true,
    }
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
        standingsData: responseJson,
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
            utcDate: responseJson.data[i].utcDate
          });
        }
      }
      this.setState({
        isMatchesLoading: false,
        matchesData: responseJson,
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
        gapsData: responseJson,
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
        <View style={{flex: 1, padding: 20}}>
          <ActivityIndicator/>
        </View>
      )
    }

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <FlatList
          data={this.state.matches.sort((a, b) => (a.matchday - b.matchday))}
          renderItem={({item}) =>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text>{item.homeTeamName}</Text>
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
                buttonSize={10}
                buttonOuterSize={20}
                buttonStyle={{}}
                buttonWrapStyle={{margin: 5}}
              />
              <Text>{item.awayTeamName}</Text>
            </View>
          }
          keyExtractor={(item, index) => 'match_'+item.id}
        />
        <Button
          title="Calculate"
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
            console.log('A');
            if (a.sub.diff == b.sub.diff) {
              console.log('B');
              if (a.goalsDiff == b.goalsDiff) {
                console.log('C');
                b.goalsFor - a.goalsFor
              } else {
                console.log('D');
                b.goalsDiff - a.goalsDiff
              }
            } else {
              console.log('X');
              return b.sub.diff - a.sub.diff
            }
          } else {
            console.log('Y');
            return b.sub.pts - a.sub.pts;
          }
        });
        console.log('____');
        console.log(groupTeamsList);
        
        for (var v=0; v<groupTeamsList.length; v++) {
          sortedTeams.unshift(groupTeamsList[v]);
        }
        console.log('____');
        console.log(sortedTeams);
      }
    }

    this.setState({
      sortedTeams: sortedTeams
    }, function(){

    });
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Calculated Table Screen</Text>
        <FlatList
          data={this.state.sortedTeams}
          renderItem={({item, index}) =>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text>
                | {item.name} | {item.points} | {item.position} -> {index+1}
              </Text>
            </View>
          }
          keyExtractor={(item, index) => 'team_'+item.id}
        />
      </View>
    );
  }
}

const RootStack = createStackNavigator(
  {
    Home: HomeScreen,
    Matches: MatchesScreen,
    CalculatedTable: CalculatedTableScreen,
  },
  {
    initialRouteName: 'Home',
  }
);

export default createAppContainer(RootStack);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
